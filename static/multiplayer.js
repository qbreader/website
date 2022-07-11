fetch(`/api/get-room-list`)
.then(response => response.json())
.then(data => {
    for (let room of data['rooms']) {
        let a = document.createElement('a');
        a.href = `/multiplayer/${room}`;
        a.innerHTML = room;
        let li = document.createElement('li');
        li.appendChild(a);
        li.classList.add('list-group-item');
        document.getElementById('room-list').appendChild(li);
    }
});

document.getElementById('form').addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = '/multiplayer/' + document.getElementById('new-room-name').value;
});