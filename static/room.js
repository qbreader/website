var socket;

const roomName = location.pathname.substring(13);
var username = localStorage.getItem('username');
var validCategories = [];
var validSubcategories = [];

function connectToWebSocket() {
    socket = new WebSocket(location.href.replace('http', 'ws'), roomName);
    socket.onopen = function () {
        socket.send(JSON.stringify({ type: 'join', username: username }));
        console.log('Connected to websocket');
    }
    socket.onmessage = function (event) {
        let data = JSON.parse(event.data);
        switch (data.type) {
            case 'set-name':
                document.getElementById('set-name').value = data.value;
                break;
            case 'packet-number':
                document.getElementById('packet-number').value = data.value;
                break;
            case 'start':
                start('tossups');
                break;
            case 'buzz':
                alert('buzz');
                document.getElementById('buzz').disabled = true;
                break;
            case 'reading-speed':
                document.getElementById('reading-speed').value = data.value;
                document.getElementById('reading-speed-display').innerHTML = data.value;
                break;
            case 'update-subcategories':
                validSubcategories = data.value;
                loadCategories(validCategories, validSubcategories);
                break;
            case 'update-categories':
                validCategories = data.value;
                loadCategories(validCategories, validSubcategories);
                break;
        }
    }
    socket.onclose = function () {
        socket.send(JSON.stringify({ type: 'leave', username: username }));
        console.log('Disconnected from websocket');
    }
}

document.getElementById('username').value = localStorage.getItem('username');
document.getElementById('username').addEventListener('change', function () {
    socket.send(JSON.stringify({ 'type': 'change-username', old: username, new: this.value }));
    username = this.value;
    localStorage.setItem('username', username);
});

// Event listeners
document.getElementById('reading-speed').oninput = function () {
    localStorage.setItem('speed', this.value);
    document.getElementById('reading-speed-display').innerHTML = this.value;
    socket.send(JSON.stringify({ 'type': 'reading-speed', value: this.value }));
}

document.getElementById('start').addEventListener('click', function () {
    this.blur();
    start('tossups');
    socket.send(JSON.stringify({ 'type': 'start' }));
});

document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    buzz();
    socket.send(JSON.stringify({ type: 'buzz', username: username }));
});

document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    pause();
    socket.send(JSON.stringify({ type: 'pause', username: username }));
});

document.getElementById('next').addEventListener('click', function () {
    this.blur();
    readQuestion();
    socket.send(JSON.stringify({ type: 'next', username: username }));
});

document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
});

document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        socket.send(JSON.stringify({ type: 'update-categories', value: validCategories }));
        socket.send(JSON.stringify({ type: 'update-subcategories', value: validSubcategories }));
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        socket.send(JSON.stringify({ type: 'update-subcategories', value: validSubcategories }))
    });
});

var packetNameField = document.getElementById('set-name');
packetNameField.addEventListener('change', function () {
    localStorage.setItem('packetNameTossupSave', packetNameField.value);
    socket.send(JSON.stringify({ type: 'set-name', value: packetNameField.value }));
});

var packetNumberField = document.getElementById('packet-number');
packetNumberField.addEventListener('change', function () {
    localStorage.setItem('packetNumberTossupSave', packetNumberField.value);
    socket.send(JSON.stringify({ type: 'packet-number', value: packetNumberField.value }));
});

var questionNumberField = document.getElementById('question-select');
questionNumberField.addEventListener('change', function () {
    localStorage.setItem('questionNumberTossupSave', questionNumberField.value);
    socket.send(JSON.stringify({ type: 'question-number', value: questionNumberField.value }));
});

window.onload = () => {
    connectToWebSocket();
    fetch(`/api/get-room?room=${encodeURI(roomName)}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('set-name').value = data.setName;
            document.getElementById('packet-number').value = data.packetNumbers;
            document.getElementById('question').value = data.setName;
            validCategories = data.validCategories;
            validSubcategories = data.validSubcategories;
            loadCategories(validCategories, validSubcategories);
        });
}