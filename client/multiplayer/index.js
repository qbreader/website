fetch(`/api/get-room-list`)
.then(response => response.json())
.then(data => {
    for (let room of data['rooms']) {
        let a = document.createElement('a');
        a.href = `/multiplayer/${room[0]}`;
        a.innerHTML = decodeURIComponent(room[0]);
        let li = document.createElement('li');
        li.appendChild(a);
        li.appendChild(document.createTextNode(` - Number of players: ${room[1]}`));
        li.classList.add('list-group-item');
        document.getElementById('room-list').appendChild(li);
    }
});

document.getElementById('form').addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = '/multiplayer/' + encodeURIComponent(document.getElementById('new-room-setName').value.replaceAll(' ', '-'));
});