var rooms = {};

function createRoom(roomName) {
    rooms[roomName] = {
        players: [],
        setName: '',
        packetNumbers: [],
        packetNumber: -1,
        currentQuestionNumber: 0,
        readingSpeed: 50,
        validCategories: [],
        validSubcategories: [],
    }
}

function createPlayer(roomName, username) {
    rooms[roomName].players.push({
        username: username,
        tossupStatline: [],
        points: 0
    });
}

function changeUsername(roomName, username, newUsername) {
    rooms[roomName].players.forEach(player => {
        if (player.username === username) {
            player.username = newUsername;
        }
    });
}

function getRoom(roomName) {
    if (roomName in rooms) {
        return rooms[roomName];
    } else {
        return null;
    }
}

/**
 * 
 * @param {JSON} message 
 */
function parseMessage(roomName, message) {
    switch (message.type) {
        case 'join':
            if (!(roomName in rooms)) createRoom(roomName);
            createPlayer(roomName, message.username);
            break;
        case 'change-username':
            changeUsername(roomName, message.old, message.new);
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
    }

    console.log(rooms);
}

module.exports = {parseMessage};