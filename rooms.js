const uuid = require('uuid');

const database = require('./database');
const quizbowl = require('./quizbowl');


var rooms = {};
var sockets = {};

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
    rooms[roomName].tossup = nextQuestion;
    rooms[roomName].packetNumbers = rooms[roomName].packetNumbers.filter(packetNumber => packetNumber >= nextQuestion.packetNumber);
    rooms[roomName].packetNumber = nextQuestion.packetNumber;
    rooms[roomName].questionNumber = nextQuestion.questionNumber;
    rooms[roomName].wordIndex = 0;
    rooms[roomName].buzzedIn = false;
}


/**
 * @param {JSON} message 
 */
async function parseMessage(roomName, message) {
    switch (message.type) {
        case 'buzz':
            buzz(roomName, message.userId);
            return;
        case 'change-username':
        case 'join':
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
            message.paused = togglePause(roomName);
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
    if (rooms[roomName].buzzedIn) {
        sendSocketMessage(roomName, {
            type: 'lost-buzzer-race',
            userId: userId,
            username: rooms[roomName].players[userId].username
        });
    } else {
        clearTimeout(rooms[roomName].buzzTimeout);
        rooms[roomName].buzzedIn = true;
        sendSocketMessage(roomName, {
            type: 'buzz',
            userId: userId,
            username: rooms[roomName].players[userId].username
        });
        sendSocketMessage(roomName, {
            type: 'update-question',
            word: '(#)'
        });
    }
}


function createPlayer(roomName, socket) {
    let userId = uuid.v4();
    rooms[roomName].players[userId] = {
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

    socket.userId = userId;
    socket.on('message', (message) => {
        message = JSON.parse(message);
        parseMessage(roomName, message);
    });

    socket.on('close', async () => {
        console.log(`User ${userId} closed connection in room ${roomName}`);
        deletePlayer(roomName, userId);
        pruneRoom(roomName);
    });

    sockets[roomName].push(socket);

    socket.send(JSON.stringify({
        type: 'user-id',
        userId: userId
    }));

    if (rooms[roomName].questionProgress > 0) {
        socket.send(JSON.stringify({
            type: 'update-question',
            word: rooms[roomName].tossup.question.split(' ').slice(0, rooms[roomName].wordIndex).join(' ')
        }));
    }

    if (rooms[roomName].questionProgress === 2) {
        socket.send(JSON.stringify({
            type: 'update-answer',
            answer: rooms[roomName].tossup.answer
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
        tossup: {},
        wordIndex: 0,
        endOfSet: false,
        questionProgress: 0, // 0 = not started, 1 = reading, 2 = answer revealed
        public: true,
        allowMultipleBuzzes: true,
        selectByDifficulty: false,
        paused: false,
        buzzTimeout: null,
        buzzedIn: false
    }

    sockets[roomName] = [];
    return true;
}


function getCurrentQuestion(roomName) {
    return {
        endOfSet: rooms[roomName].endOfSet,
        question: rooms[roomName].tossup,
        packetNumber: rooms[roomName].packetNumber,
        questionNumber: rooms[roomName].questionNumber,
        setName: rooms[roomName].setName,
    };
}


function deletePlayer(roomName, userId) {
    for (let i = 0; i < sockets[roomName]; i++) {
        if (sockets[roomName][i].userId === userId) {
            sockets[roomName].splice(i, 1);
            return true;
        }
    }

    sendSocketMessage(roomName, {
        type: 'leave',
        userId: userId,
        username: rooms[roomName].players[userId].username
    });

    delete rooms[roomName].players[userId];

    return false;
}


function getRoom(roomName) {
    if (!(roomName in rooms)) createRoom(roomName);

    let copy = rooms[roomName];
    delete copy.buzzTimeout;
    return copy;
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
    let endOfQuestion = (rooms[roomName].wordIndex === rooms[roomName].tossup.question.split(' ').length);
    let inPower = rooms[roomName].tossup.question.includes('(*)') && !rooms[roomName].tossup.question.split(' ').slice(0, rooms[roomName].wordIndex).join(' ').includes('(*)');
    let score = quizbowl.scoreTossup(rooms[roomName].tossup.answer, givenAnswer, inPower, endOfQuestion);
    rooms[roomName].buzzedIn = false;
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
        delete sockets[roomName];
        return true;
    }

    return false;
}


function revealQuestion(roomName) {
    let remainingQuestion = rooms[roomName].tossup.question.split(' ').slice(rooms[roomName].wordIndex).join(' ');
    sendSocketMessage(roomName, {
        type: 'update-question',
        word: remainingQuestion
    });

    sendSocketMessage(roomName, {
        type: 'update-answer',
        answer: rooms[roomName].tossup.answer
    });

    rooms[roomName].wordIndex = rooms[roomName].tossup.question.split(' ').length;
}


function sendSocketMessage(roomName, message) {
    for (let socket of sockets[roomName]) {
        socket.send(JSON.stringify(message));
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
    let questionSplit = rooms[roomName].tossup.question.split(' ');
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