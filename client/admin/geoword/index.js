import { titleCase } from '../../scripts/utilities/strings.js';

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

        const fields = ['stats', 'category-stats', 'protests', 'leaderboard'];

        for (const field of fields) {
          const a = document.createElement('a');
          a.href = `/admin/geoword/${field}?packetName=${name}&division=${encodeURIComponent(division)}`;
          a.textContent = titleCase(field);

          li.appendChild(a);
          li.appendChild(document.createTextNode(' | '));
        }

        const a = document.createElement('a');
        a.href = `/geoword/paid/packet?packetName=${name}&division=${encodeURIComponent(division)}`;
        a.textContent = 'Packet';

        li.appendChild(a);

        ul.appendChild(li);
      }

      gameListSelect.appendChild(listGroupItem);
    });
  });
