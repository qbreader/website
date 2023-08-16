fetch('/api/geoword/packet-list')
    .then(response => response.json())
    .then(data => {
        const { packetList } = data;
        const gameListSelect = document.getElementById('packet-list');
        packetList.forEach(game => {
            const { name, divisions } = game;

            const b = document.createElement('b');
            b.textContent = `${titleCase(name)}:`;

            const ul = document.createElement('ul');

            const listGroupItem = document.createElement('li');
            listGroupItem.className = 'list-group-item';
            listGroupItem.appendChild(b);
            listGroupItem.appendChild(ul);

            for (const division of divisions) {
                const li = document.createElement('li');
                li.textContent = `${titleCase(division)}: `;

                const a1 = document.createElement('a');
                a1.href = `/admin/geoword/stats/${name}/${encodeURIComponent(division)}`;
                a1.textContent = 'Stats';

                const a2 = document.createElement('a');
                a2.href = `/admin/geoword/protests/${name}/${encodeURIComponent(division)}`;
                a2.textContent = 'Protests';

                const a3 = document.createElement('a');
                a3.href = `/admin/geoword/leaderboard/${name}?${encodeURIComponent(division)}`;
                a3.textContent = 'Leaderboard';

                const a4 = document.createElement('a');
                a4.href = `/geoword/packet/${name}?${encodeURIComponent(division)}`;
                a4.textContent = 'Packet';

                li.appendChild(a1);
                li.appendChild(document.createTextNode(' | '));
                li.appendChild(a2);
                li.appendChild(document.createTextNode(' | '));
                li.appendChild(a3);
                li.appendChild(document.createTextNode(' | '));
                li.appendChild(a4);

                ul.appendChild(li);
            }

            gameListSelect.appendChild(listGroupItem);
        });
    });
