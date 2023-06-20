getAccountUsername().then(username => {
    if (username) {
        document.getElementById('login-warning').classList.add('d-none');
    }
});

fetch('/api/geoword/packet-list')
    .then(response => response.json())
    .then(data => {
        const { packetList } = data;
        const gameListSelect = document.getElementById('packet-list');
        packetList.forEach(game => {
            const a = document.createElement('a');
            a.href = '/geoword/division/' + game;
            a.textContent = titleCase(game);

            const li = document.createElement('li');
            li.appendChild(a);

            gameListSelect.appendChild(li);
        });
    });
