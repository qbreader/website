import { titleCase } from '../../scripts/utilities/strings.js';

fetch('/api/geoword/packet-list')
  .then(response => response.json())
  .then(data => {
    const { packetList } = data;
    const gameListSelect = document.getElementById('packet-list');
    packetList.forEach(game => {
      const { name } = game;

      const b = document.createElement('b');
      b.textContent = `${titleCase(name)}: `;

      const listGroupItem = document.createElement('li');
      listGroupItem.className = 'list-group-item';
      listGroupItem.appendChild(b);

      for (const field of ['stats', 'category-stats', 'protests', 'leaderboard', 'manage-payments']) {
        const a = document.createElement('a');
        a.href = `/admin/geoword/${field}?packetName=${name}`;
        a.textContent = titleCase(field);

        listGroupItem.appendChild(a);
        listGroupItem.appendChild(document.createTextNode(' | '));
      }

      const a = document.createElement('a');
      a.href = `/geoword/paid/results/packet?packetName=${name}`;
      a.textContent = 'Packet';

      listGroupItem.appendChild(a);

      gameListSelect.appendChild(listGroupItem);
    });
  });
