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

                let isFirst = true;
                const fields = ['stats', 'category-stats', 'protests', 'leaderboard', 'packet'];

                for (const field of fields) {
                    const a = document.createElement('a');
                    a.href = `/admin/geoword/${field}/${name}/${encodeURIComponent(division)}`;
                    a.textContent = titleCase(field);

                    if (isFirst) {
                        isFirst = false;
                    } else {
                        li.appendChild(document.createTextNode(' | '));
                    }

                    li.appendChild(a);
                }

                ul.appendChild(li);
            }

            gameListSelect.appendChild(listGroupItem);
        });
    });
