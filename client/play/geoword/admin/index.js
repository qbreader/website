import { titleCase } from '../../../../shared/string-utils.js';

fetch('/api/geoword/admin/packet-list')
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
        a.href = `/play/geoword/admin/${field}?packetName=${name}`;
        a.textContent = titleCase(field);

        listGroupItem.appendChild(a);
        listGroupItem.appendChild(document.createTextNode(' | '));
      }

      const packetLink = document.createElement('a');
      packetLink.href = `/play/geoword/results/packet?packetName=${name}`;
      packetLink.textContent = 'Packet';

      const teamLeaderboardLink = document.createElement('a');
      teamLeaderboardLink.href = `/play/geoword/results/team-leaderboard?packetName=${name}`;
      teamLeaderboardLink.textContent = 'Team Leaderboard';

      listGroupItem.appendChild(packetLink);
      listGroupItem.appendChild(document.createTextNode(' | '));
      listGroupItem.appendChild(teamLeaderboardLink);

      gameListSelect.appendChild(listGroupItem);
    });
  });
