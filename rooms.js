const database = require('./database');
const quizbowl = require('./quizbowl');


var rooms = {};


async function goToNextQuestion(roomName) {
    let data = await database.getNextQuestion(rooms[roomName].setName, rooms[roomName].packetNumbers, rooms[roomName].questionNumber, rooms[roomName].validCategories, rooms[roomName].validSubcategories);

    rooms[roomName].isEndOfSet = Object.keys(data).length === 0;
    // if (data.isEndOfSet) {
    //     return;
    // }

    rooms[roomName].isQuestionInProgress = true;
    rooms[roomName].question = data;
    rooms[roomName].packetNumbers = rooms[roomName].packetNumbers.filter(packetNumber => packetNumber >= data.packetNumber);
    rooms[roomName].packetNumber = data.packetNumber;
    rooms[roomName].questionNumber = data.questionNumber;
}


/**
 * @param {JSON} message 
 */
async function parseMessage(roomName, message) {
    switch (message.type) {
        case 'toggle-visibility':
            rooms[roomName].isPublic = message.isPublic;
            return message;
        case 'toggle-multiple-buzzes':
            rooms[roomName].allowMultipleBuzzes = message.allowMultipleBuzzes;
            return message;
        case 'join':
            createPlayer(roomName, message.userId, message.username);
            return message;
        case 'change-username':
            updateUsername(roomName, message.userId, message.username);
            return message;
        case 'clear-stats':
            createPlayer(roomName, message.userId, message.username, true);
            return message;
        case 'give-answer':
            let score = quizbowl.scoreTossup(rooms[roomName].question.answer, message.givenAnswer, message.inPower, message.endOfQuestion);
            updateScore(roomName, message.userId, score, message.celerity);
            message.celerity = rooms[roomName].players[message.userId].celerity.correct.average;
            message.score = score;
            return message;
        case 'set-name':
            rooms[roomName].setName = message.value;
            rooms[roomName].questionNumber = -1;
            return message;
        case 'packet-number':
            rooms[roomName].packetNumbers = message.value;
            rooms[roomName].packetNumber = message.value[0];
            rooms[roomName].questionNumber = -1;
            return message;
        case 'reading-speed':
            rooms[roomName].readingSpeed = message.value;
            return message;
        case 'update-categories':
            rooms[roomName].validCategories = message.categories;
            rooms[roomName].validSubcategories = message.subcategories;
            return message;
        case 'leave':
            delete rooms[roomName].players[message.userId];
            return message;
        case 'start':
        case 'next':
            await goToNextQuestion(roomName);
            return message;
        default:
            return message;
    }
}


function createPlayer(roomName, userId, username, overrideExistingPlayer = false) {
    if (!overrideExistingPlayer && (userId in rooms[roomName].players)) {
        return false;
    }

    rooms[roomName].players[userId] = {
        username: username,
        userId: userId,
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

    return true;
}


function createRoom(roomName) {
    rooms[roomName] = {
        players: {},
        setName: '2022 PACE NSC',
        packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        packetNumber: 1,
        questionNumber: 0,
        readingSpeed: 50,
        validCategories: [],
        validSubcategories: [],
        question: {},
        isEndOfSet: false,
        isQuestionInProgress: false,
        isPublic: true,
        allowMultipleBuzzes: false
    }
}


function deleteRoom(roomName) {
    delete rooms[roomName];
}


function getCurrentQuestion(roomName) {
    return {
        isEndOfSet: rooms[roomName].isEndOfSet,
        question: rooms[roomName].question,
        packetNumber: rooms[roomName].packetNumber,
        questionNumber: rooms[roomName].questionNumber,
        setName: rooms[roomName].setName,
    };
}


function getRoom(roomName) {
    if (!(roomName in rooms)) createRoom(roomName);

    return rooms[roomName];
}


function getRoomList(showPrivateRooms = false) {
    let roomList = [];
    for (let room in rooms) {
        if (rooms[room].isPublic || showPrivateRooms) {
            roomList.push([room, Object.keys(rooms[room].players).length]);
        }
    }
    return roomList;
}


function updateUsername(roomName, userId, username) {
    rooms[roomName].players[userId].username = username;
}


function updateScore(roomName, userId, score, celerity) {
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
        rooms[roomName].isQuestionInProgress = false;

        let numCorrect = rooms[roomName].players[userId].powers + rooms[roomName].players[userId].tens;
        rooms[roomName].players[userId].celerity.correct.total += celerity;
        rooms[roomName].players[userId].celerity.correct.average = rooms[roomName].players[userId].celerity.correct.total / numCorrect;
    }

    rooms[roomName].players[userId].points += score;
    rooms[roomName].players[userId].celerity.all.total += celerity;
    rooms[roomName].players[userId].celerity.all.average = rooms[roomName].players[userId].celerity.all.total / rooms[roomName].players[userId].tuh;
    return score;
}


module.exports = { getRoom, getRoomList, getCurrentQuestion, goToNextQuestion, deleteRoom, createRoom, updateScore, parseMessage };