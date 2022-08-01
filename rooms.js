const uuid = require('uuid');

const database = require('./database');
const quizbowl = require('./quizbowl');


var rooms = {};


async function goToNextQuestion(roomName) {
    var nextQuestion;
    if (rooms[roomName].selectByDifficulty) {
        nextQuestion = await database.getNextQuestion(rooms[roomName].setName, rooms[roomName].packetNumbers, rooms[roomName].questionNumber, rooms[roomName].validCategories, rooms[roomName].validSubcategories);
    } else {
        nextQuestion = await database.getRandomQuestion('tossup', rooms[roomName].difficulties, rooms[roomName].validCategories, rooms[roomName].validSubcategories);
        rooms[roomName].setName = nextQuestion.setName;
    }

    rooms[roomName].endOfSet = Object.keys(nextQuestion).length === 0;

    rooms[roomName].questionProgress = 1;
    rooms[roomName].question = nextQuestion;
    rooms[roomName].packetNumbers = rooms[roomName].packetNumbers.filter(packetNumber => packetNumber >= nextQuestion.packetNumber);
    rooms[roomName].packetNumber = nextQuestion.packetNumber;
    rooms[roomName].questionNumber = nextQuestion.questionNumber;
    rooms[roomName].wordIndex = 0;
}


/**
 * @param {JSON} message 
 */
async function parseMessage(roomName, message) {
    switch (message.type) {
        case 'buzz':
            buzz(roomName, message.userId);
            break;
        case 'change-username':
            updateUsername(roomName, message.userId, message.username);
            break;
        case 'clear-stats':
            rooms[roomName].players[message.userId].powers = 0;
            rooms[roomName].players[message.userId].tens = 0;
            rooms[roomName].players[message.userId].zeroes = 0;
            rooms[roomName].players[message.userId].negs = 0;
            rooms[roomName].players[message.userId].points = 0;
            rooms[roomName].players[message.userId].tuh = 0;
            rooms[roomName].players[message.userId].celerity.all.total = 0;
            rooms[roomName].players[message.userId].celerity.all.average = 0;
            rooms[roomName].players[message.userId].celerity.correct.total = 0;
            rooms[roomName].players[message.userId].celerity.correct.average = 0;
            break;
        case 'difficulties':
            rooms[roomName].difficulties = message.value;
            break;
        case 'give-answer':
            let score = giveAnswer(roomName, message.userId, message.givenAnswer, message.celerity);
            message.celerity = rooms[roomName].players[message.userId].celerity.correct.average;
            message.score = score;
            break;
        case 'leave':
            deletePlayer(roomName, message.userId);
            break;
        case 'next':
        case 'skip':
            clearTimeout(rooms[roomName].buzzTimeout);
            revealQuestion(roomName);
        case 'start':
            await goToNextQuestion(roomName);
            sendSocketMessage(roomName, message);
            updateQuestion(roomName);
            return;
        case 'packet-number':
            rooms[roomName].packetNumbers = message.value;
            rooms[roomName].packetNumber = message.value[0];
            rooms[roomName].questionNumber = -1;
            break;
        case 'pause':
            data.paused = togglePause(roomName);
            break;
        case 'reading-speed':
            rooms[roomName].readingSpeed = message.value;
            break;
        case 'set-name':
            rooms[roomName].setName = message.value;
            rooms[roomName].questionNumber = -1;
            break;
        case 'toggle-multiple-buzzes':
            rooms[roomName].allowMultipleBuzzes = message.allowMultipleBuzzes;
            break;
        case 'toggle-select-by-difficulty':
            rooms[roomName].selectByDifficulty = message.selectByDifficulty;
            rooms[roomName].setName = message.setName;
            rooms[roomName].questionNumber = -1;
            break;
        case 'toggle-visibility':
            rooms[roomName].public = message.public;
            break;
        case 'update-categories':
            rooms[roomName].validCategories = message.categories;
            rooms[roomName].validSubcategories = message.subcategories;
            break;
    }

    sendSocketMessage(roomName, message);
}


function buzz(roomName, userId) {
    clearTimeout(rooms[roomName].buzzTimeout);
    sendSocketMessage(roomName, {
        type: 'update-question',
        word: '(#)'
    });
}


function createPlayer(roomName, socket) {
    let userId = uuid.v4();
    rooms[roomName].players[userId] = {
        socket: socket,
        username: '',
        powers: 0,
        tens: 0,
        zeroes: 0,
        negs: 0,
        points: 0,
        tuh: 0,
        celerity: {
            all: {
                total: 0,
                average: 0
            },
            correct: {
                total: 0,
                average: 0
            }
        }
    };

    socket.send(JSON.stringify({
        type: 'user-id',
        userId: userId
    }));

    if (rooms[roomName].questionProgress > 0) {
        socket.send(JSON.stringify({
            type: 'update-question',
            word: rooms[roomName].question.split(' ').slice(0, rooms[roomName].wordIndex).join(' ')
        }));
    }

    if (rooms[roomName].questionProgress === 2) {
        socket.send(JSON.stringify({
            type: 'update-answer',
            word: rooms[roomName].question.split(' ').slice(0, rooms[roomName].wordIndex).join(' ')
        }));
    }

    return true;
}


function createRoom(roomName) {
    if (roomName in rooms) {
        return false;
    }

    rooms[roomName] = {
        players: {},
        difficulties: [4, 5],
        setName: '2022 PACE NSC',
        packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        packetNumber: 1,
        questionNumber: 0,
        readingSpeed: 50,
        validCategories: [],
        validSubcategories: [],
        question: {},
        wordIndex: 0,
        endOfSet: false,
        questionProgress: 0, // 0 = not started, 1 = reading, 2 = answer revealed
        public: true,
        allowMultipleBuzzes: true,
        selectByDifficulty: false,
        paused: false,
    }

    return true;
}


function getCurrentQuestion(roomName) {
    return {
        endOfSet: rooms[roomName].endOfSet,
        question: rooms[roomName].question,
        packetNumber: rooms[roomName].packetNumber,
        questionNumber: rooms[roomName].questionNumber,
        setName: rooms[roomName].setName,
    };
}


function deletePlayer(roomName, socket) {
    for (let userId in rooms[roomName].players) {
        if (rooms[roomName].players[userId].socket === socket) {
            console.log(`User ${userId} closed connection in room ${roomName}`);
            delete rooms[roomName].players[userId];
            return true;
        }
    }

    return false;
}


function getRoom(roomName) {
    if (!(roomName in rooms)) createRoom(roomName);

    return rooms[roomName];
}


function getRoomList(showPrivateRooms = false) {
    let roomList = [];
    for (let room in rooms) {
        if (rooms[room].public || showPrivateRooms) {
            roomList.push([room, Object.keys(rooms[room].players).length]);
        }
    }
    return roomList;
}


function giveAnswer(roomName, userId, givenAnswer, celerity) {
    let endOfQuestion = (rooms[roomName].wordIndex === rooms[roomName].question.question.split(' ').length);
    let inPower = rooms[roomName].question.question.includes('(*)') && !rooms[roomName].question.question.split(' ').slice(0, rooms[roomName].wordIndex).join(' ').includes('(*)');
    let score = quizbowl.scoreTossup(rooms[roomName].question.answer, givenAnswer, inPower, endOfQuestion);
    updateScore(roomName, userId, score, celerity);

    if (score < 0) {
        updateQuestion(roomName);
    } else {
        revealQuestion(roomName);
    }

    return score;
}


function pruneRoom(roomName) {
    if (Object.keys(rooms[roomName].players).length === 0) {
        console.log(`Deleted room ${roomName}`);
        delete rooms[roomName];
        return true;
    }

    return false;
}


function revealQuestion(roomName) {
    let remainingQuestion = rooms[roomName].question.question.split(' ').slice(rooms[roomName].wordIndex).join(' ');
    sendSocketMessage(roomName, {
        type: 'update-question',
        word: remainingQuestion
    });

    sendSocketMessage(roomName, {
        type: 'update-answer',
        answer: rooms[roomName].question.answer
    });

    rooms[roomName].wordIndex = rooms[roomName].question.question.split(' ').length;
}


function sendSocketMessage(roomName, message) {
    for (let userId in rooms[roomName].players) {
        rooms[roomName].players[userId].socket.send(JSON.stringify(message));
    }
}


function togglePause(roomName) {
    rooms[roomName].paused = !rooms[roomName].paused;
    if (rooms[roomName].paused) {
        clearTimeout(rooms[roomName].buzzTimeout);
        return true;
    } else {
        updateQuestion(roomName);
        return false;
    }
}


function updateQuestion(roomName) {
    let wordIndex = rooms[roomName].wordIndex;
    let questionSplit = rooms[roomName].question.question.split(' ');
    if (wordIndex >= questionSplit.length) {
        return;
    }

    let word = questionSplit[wordIndex];

    // calculate time needed before reading next word
    let time = Math.log(word.length) + 1;
    if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
        || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
        time += 2;
    else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
        time += 0.75;
    else if (word === "(*)")
        time = 0;

    sendSocketMessage(roomName, {
        type: 'update-question',
        word: word
    });

    rooms[roomName].buzzTimeout = setTimeout(() => {
        updateQuestion(roomName);
    }, time * 0.9 * (125 - rooms[roomName].readingSpeed));

    rooms[roomName].wordIndex++;
}


function updateUsername(roomName, userId, username) {
    rooms[roomName].players[userId].username = username;
}


function updateScore(roomName, userId, score, celerity) {
    rooms[roomName].players[userId].points += score;
    rooms[roomName].players[userId].celerity.all.total += celerity;
    rooms[roomName].players[userId].celerity.all.average = rooms[roomName].players[userId].celerity.all.total / rooms[roomName].players[userId].tuh;

    if (score > 10) {
        rooms[roomName].players[userId].powers++;
    } else if (score === 10) {
        rooms[roomName].players[userId].tens++;
    } else if (score === 0) {
        rooms[roomName].players[userId].zeroes++;
    } else {
        rooms[roomName].players[userId].negs++;
    }

    if (score > 0) {
        // increase TUH for every player by 1
        for (let player in rooms[roomName].players) {
            rooms[roomName].players[player].tuh++;
        }
        rooms[roomName].questionProgress = 2;

        let numCorrect = rooms[roomName].players[userId].powers + rooms[roomName].players[userId].tens;
        rooms[roomName].players[userId].celerity.correct.total += celerity;
        rooms[roomName].players[userId].celerity.correct.average = rooms[roomName].players[userId].celerity.correct.total / numCorrect;
    }
}


module.exports = { getRoom, getRoomList, getCurrentQuestion, goToNextQuestion, createPlayer, createRoom, deletePlayer, pruneRoom, parseMessage };