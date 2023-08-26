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
    .then(data => {
        const { roomList } = data;
        roomList.sort((a, b) => {
            if (a.onlineCount === b.onlineCount) {
                return b.playerCount - a.playerCount;
            } else {
                return b.onlineCount - a.onlineCount;
            }
        });
        return roomList;
    })
    .then(roomList => {
        roomList.forEach(room => {
            const { roomName, playerCount, onlineCount, isPermanent } = room;

            const a = document.createElement('a');
            a.href = `/multiplayer/${encodeURIComponent(roomName)}`;
            a.textContent = roomName;

            const li = document.createElement('li');
            li.appendChild(a);
            li.appendChild(document.createTextNode(` - ${playerCount} player${playerCount === 1 ? '' : 's'} - ${onlineCount} online`));
            li.classList.add('list-group-item');

            if (isPermanent) {
                document.getElementById('permanent-room-list').appendChild(li);
            } else {
                document.getElementById('room-list').appendChild(li);
            }
        });
    });

fetch('/api/random-name')
    .then(res => res.json())
    .then(data => data.randomName)
    .then(randomName => {
        document.getElementById('new-room-name').placeholder = randomName;
    });
