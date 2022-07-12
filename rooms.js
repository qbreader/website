const database = require('./database');

var rooms = {};

function createRoom(roomName) {
    rooms[roomName] = {
        players: {},
        setTitle: '',
        setYear: 0,
        setName: '',
        packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 178, 19, 20, 21, 22, 23, 24],
        packetNumber: 0,
        currentQuestionNumber: -1,
        readingSpeed: 50,
        validCategories: [],
        validSubcategories: [],
        currentQuestion: {}
    }
}

function createPlayer(roomName, userId, username) {
    if (userId in rooms[roomName].players) return false;

    rooms[roomName].players[userId] = {
        username: username,
        userId: userId,
        powers: 0,
        tens: 0,
        zeroes: 0,
        negs: 0,
        points: 0
    };

    return true;
}

function getRoom(roomName) {
    if (roomName in rooms) {
        return rooms[roomName];
    } else {
        return {};
    }
}

function getRoomList() {
    return Object.keys(rooms).map((roomName) => {
        return [roomName, Object.keys(rooms[roomName].players).length]
    });
}

function getCurrentQuestion(roomName) {
    return {
        question: rooms[roomName].currentQuestion,
        packetNumber: rooms[roomName].packetNumber,
        questionNumber: rooms[roomName].currentQuestionNumber,
        setTitle: rooms[roomName].setTitle,
    };
}

function goToNextQuestion(roomName) {
    let data = database.getNextQuestion(rooms[roomName].setYear, rooms[roomName].setName, rooms[roomName].packetNumbers, rooms[roomName].currentQuestionNumber, rooms[roomName].validCategories, rooms[roomName].validSubcategories);

    rooms[roomName].currentQuestion = data.question;
    rooms[roomName].packetNumbers = data.packetNumbers;
    rooms[roomName].packetNumber = data.packetNumber;
    rooms[roomName].currentQuestionNumber = data.currentQuestionNumber;

    return data.question;
}

function deleteRoom(roomName) {
    delete rooms[roomName];
}

function updateUsername(roomName, userId, username) {
    rooms[roomName].players[userId].username = username;
}

function updateScore(roomName, userId, score) {
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
        case 'join':
            createPlayer(roomName, message.userId, message.username);
            break;
        case 'change-username':
            updateUsername(roomName, message.userId, message.username);
            break;
        case 'set-title':
            rooms[roomName].setTitle = message.value;
            let [year, name] = database.parseSetTitle(message.value);
            rooms[roomName].setYear = year;
            rooms[roomName].setName = name;
            break;
        case 'packet-number':
            rooms[roomName].packetNumbers = message.value;
            break;
        case 'reading-speed':
            rooms[roomName].readingSpeed = message.value;
            break;
        case 'update-categories':
            rooms[roomName].validCategories = message.value;
            break;
        case 'update-subcategories':
            rooms[roomName].validSubcategories = message.value;
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