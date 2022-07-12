var rooms = {};

function createRoom(roomName) {
    rooms[roomName] = {
        players: {},
        setName: '',
        packetNumbers: [],
        packetNumber: -1,
        currentQuestionNumber: 0,
        readingSpeed: 50,
        validCategories: [],
        validSubcategories: [],
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

function changeUsername(roomName, userId, username) {
    rooms[roomName].players[userId].username = username;
}

function getRoom(roomName) {
    if (roomName in rooms) {
        return rooms[roomName];
    } else {
        return {
            players: {},
            setName: '',
            packetNumbers: [],
            packetNumber: -1,
            currentQuestionNumber: 0,
            readingSpeed: 50,
            validCategories: [],
            validSubcategories: [],
        };
    }
}

function getRoomList() {
    return Object.keys(rooms).map((roomName) => {
        return [roomName, Object.keys(rooms[roomName].players).length]
    });
}

function deleteRoom(roomName) {
    delete rooms[roomName];
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

/**
 * 
 * @param {JSON} message 
 */
function parseMessage(roomName, message) {
    switch (message.type) {
        case 'join':
            if (!(roomName in rooms)) createRoom(roomName);
            createPlayer(roomName, message.userId, message.username);
            break;
        case 'change-username':
            changeUsername(roomName, message.userId, message.username);
            break;
        case 'set-name':
            rooms[roomName].setName = message.value;
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
    }
}

module.exports = { getRoom, getRoomList, deleteRoom, updateScore, parseMessage };