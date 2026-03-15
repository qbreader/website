function getToggleRoomLockHandler (roomName, lock) {
  return function (event) {
    event.preventDefault();
    fetch('/api/admin/multiplayer/toggle-room-lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, lock })
    }).then(response => response.text())
      .then(message => {
        window.alert(message);
        window.location.reload();
      });
  };
}

fetch('/api/admin/multiplayer/room-list')
  .then(response => response.json())
  .then(data => {
    const { activePlayers, activeRooms, roomList } = data;
    document.getElementById('active-players').textContent = activePlayers;
    document.getElementById('active-rooms').textContent = activeRooms;

    roomList.sort((a, b) => a.onlineCount === b.onlineCount ? b.playerCount - a.playerCount : b.onlineCount - a.onlineCount);

    roomList.forEach(room => {
      const { roomName, playerCount, settings, onlineCount, isPermanent } = room;

      const a1 = document.createElement('a');
      a1.href = `/play/mp/${encodeURIComponent(roomName)}`;
      a1.textContent = roomName;

      const div = document.createElement('div');
      div.appendChild(a1);
      div.appendChild(document.createTextNode(` - ${playerCount} player${playerCount === 1 ? '' : 's'} - ${onlineCount} online`));

      const a2 = document.createElement('a');
      a2.href = '#';
      a2.textContent = settings.lock ? 'Unlock' : 'Lock';
      a2.classList.add('btn', 'btn-sm', settings.lock ? 'btn-danger' : 'btn-success');
      a2.addEventListener('click', getToggleRoomLockHandler(roomName, !settings.lock));

      const li = document.createElement('li');
      li.appendChild(div);
      li.appendChild(a2);
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      if (onlineCount === 0 && !isPermanent) {
        li.classList.add('d-none');
        li.classList.add('empty-room');
      }
      if (!settings.public) {
        li.classList.add('list-group-item-secondary');
      }

      document.getElementById(isPermanent ? 'permanent-room-list' : 'room-list').appendChild(li);
    });
  });

document.getElementById('empty-room-checkbox').addEventListener('change', function (event) {
  const emptyRooms = document.getElementsByClassName('empty-room');
  for (const emptyRoom of emptyRooms) {
    emptyRoom.classList.toggle('d-none', !event.target.checked);
  }
});
