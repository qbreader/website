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


fetch(`/api/multiplayer/room-list`)
    .then(response => response.json())
    .then(rooms => {
        Object.keys(rooms).forEach(room => {
            let a = document.createElement('a');
            a.href = `/multiplayer/${room}`;
            a.innerHTML = decodeURIComponent(room);
            let li = document.createElement('li');
            li.appendChild(a);
            li.appendChild(document.createTextNode(` - ${rooms[room][0]} player${rooms[room][0] === 1 ? '' : 's'} - ${rooms[room][1]} online`));
            li.classList.add('list-group-item');
            document.getElementById('room-list').appendChild(li);
        });
    });

fetch(`/api/random-name`)
    .then(res => res.text())
    .then(roomName => {
        document.getElementById('new-room-name').placeholder = roomName
    });