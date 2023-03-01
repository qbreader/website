document.getElementById('form').addEventListener('submit', (event) => {
    event.preventDefault();
    let roomName = document.getElementById('new-room-name').value;
    if (roomName.length === 0) {
        roomName = document.getElementById('new-room-name').placeholder;
    } else {
        roomName = roomName.replaceAll(' ', '-');
    }
    window.location.href = '/multiplayer/' + encodeURIComponent(roomName);
});


fetch('/api/multiplayer/room-list')
    .then(response => response.json())
    .then(rooms => {
        rooms = Object.entries(rooms);
        rooms.sort((a, b) => {
            if (a[1][1] === b[1][1]) {
                return b[1][0] - a[1][0];
            } else {
                return b[1][1] - a[1][1];
            }
        });
        return rooms;
    })
    .then(rooms => {
        rooms.forEach(room => {
            const [roomName, [playerCount, onlineCount, isPermanent]] = room;
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="/multiplayer/${roomName}">${decodeURIComponent(roomName)}</a>
                - ${playerCount} player${playerCount === 1 ? '' : 's'} - ${onlineCount} online
            `;
            li.classList.add('list-group-item');

            if (isPermanent) {
                document.getElementById('permanent-room-list').appendChild(li);
            } else {
                document.getElementById('room-list').appendChild(li);
            }
        });
    });

fetch('/api/random-name')
    .then(res => res.text())
    .then(roomName => {
        document.getElementById('new-room-name').placeholder = roomName;
    });
