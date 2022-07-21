const database = require('./database');

var rooms = {};

function createRoom(roomName) {
    rooms[roomName] = {
        players: {},
        setName: '2022 PACE',
        packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        packetNumber: 0,
        currentQuestionNumber: -1,
        readingSpeed: 50,
        validCategories: [],
        validSubcategories: [],
        currentQuestion: {},
        isEndOfSet: false,
        isQuestionInProgress: false,
        isPublic: true,
        allowMultipleBuzzes: false
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
        tuh: 0
    };

    return true;
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

function getCurrentQuestion(roomName) {
    return {
        isEndOfSet: rooms[roomName].isEndOfSet,
        question: rooms[roomName].currentQuestion,
        packetNumber: rooms[roomName].packetNumber,
        questionNumber: rooms[roomName].currentQuestionNumber,
        setName: rooms[roomName].setName,
    };
}

function goToNextQuestion(roomName) {
    let data = database.getNextQuestion(rooms[roomName].setName, rooms[roomName].packetNumbers, rooms[roomName].currentQuestionNumber, rooms[roomName].validCategories, rooms[roomName].validSubcategories);

    rooms[roomName].isEndOfSet = Object.keys(data).length === 0;
    if (data.isEndOfSet) {
        return;
    }

    rooms[roomName].isQuestionInProgress = true;
    rooms[roomName].currentQuestion = data;
    rooms[roomName].packetNumbers = rooms[roomName].packetNumbers.filter(packetNumber => packetNumber >= data.packetNumber);
    rooms[roomName].packetNumber = data.packetNumber;
    rooms[roomName].currentQuestionNumber = data.questionNumber;
}

function deleteRoom(roomName) {
    delete rooms[roomName];
}

function updateUsername(roomName, userId, username) {
    rooms[roomName].players[userId].username = username;
}

function updateScore(roomName, userId, score) {
    if (score > 0) {
        // increase TUH for every player by 1
        for (let player in rooms[roomName].players) {
            rooms[roomName].players[player].tuh++;
        }
        rooms[roomName].isQuestionInProgress = false;
    }

    if (score > 10) {
        rooms[roomName].players[userId].powers++;
    } else if (score === 10) {
        rooms[roomName].players[userId].tens++;
    } else if (score === 0) {
        rooms[roomName].players[userId].zeroes++;
    } else {
        rooms[roomName].players[userId].negs++;
    }

    rooms[roomName].players[userId].points += score;

    return score;
}

function checkAnswerCorrectness(roomName, givenAnswer, inPower, endOfQuestion) {
    if (database.checkAnswerCorrectness(rooms[roomName].currentQuestion.answer, givenAnswer)) {
        return inPower ? 15 : 10;
    } else {
        return endOfQuestion ? 0 : -5;
    }
}

/**
 * 
 * @param {JSON} message 
 */
function parseMessage(roomName, message) {
    switch (message.type) {
        case 'toggle-visibility':
            rooms[roomName].isPublic = message.isPublic;
            break;
        case 'toggle-multiple-buzzes':
            rooms[roomName].allowMultipleBuzzes = message.allowMultipleBuzzes;
            break;
        case 'join':
            createPlayer(roomName, message.userId, message.username);
            break;
        case 'change-username':
            updateUsername(roomName, message.userId, message.username);
            break;
        case 'clear-stats':
            createPlayer(roomName, message.userId, message.username, true);
            break;
        case 'set-title':
            rooms[roomName].setName = message.value;
            rooms[roomName].currentQuestionNumber = -1;
            break;
        case 'packet-number':
            rooms[roomName].packetNumbers = message.value;
            rooms[roomName].packetNumber = message.value[0];
            rooms[roomName].currentQuestionNumber = -1;
            break;
        case 'reading-speed':
            rooms[roomName].readingSpeed = message.value;
            break;
        case 'update-categories':
            rooms[roomName].validCategories = message.categories;
            rooms[roomName].validSubcategories = message.subcategories;
            break;
        case 'leave':
            delete rooms[roomName].players[message.userId];
            break;
        case 'start':
        case 'next':
            goToNextQuestion(roomName);
            break;
    }
}

module.exports = { getRoom, getRoomList, getCurrentQuestion, goToNextQuestion, deleteRoom, createRoom, updateScore, checkAnswerCorrectness, parseMessage };