fetch(`/api/get-room-list`)
.then(response => response.json())
.then(data => {
    console.log(data["rooms"]);

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