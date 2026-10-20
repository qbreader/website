import { titleCase } from '../../../../shared/string-utils.js';

const TOOL_GROUPS = [
  {
    label: 'Results',
    color: 'primary',
    tools: [
      ['Stats', '/play/geoword/admin/stats'],
      ['Category Stats', '/play/geoword/admin/category-stats'],
      ['Leaderboard', '/play/geoword/admin/leaderboard'],
      ['Team Leaderboard', '/play/geoword/results/team-leaderboard']
    ]
  },
  {
    label: 'Manage',
    color: 'success',
    tools: [
      ['Protests', '/play/geoword/admin/protests'],
      ['Manage Payments', '/play/geoword/admin/manage-payments']
    ]
  },
  {
    label: 'Questions',
    color: 'secondary',
    tools: [
      ['Packet', '/play/geoword/results/packet']
    ]
  }
];

fetch('/api/geoword/admin/packet-list')
  .then(response => response.json())
  .then(data => {
    const { packetList } = data;
    const container = document.getElementById('packet-list');
    packetList.forEach(game => {
      const { name } = game;

      const title = document.createElement('h5');
      title.className = 'card-title';
      title.textContent = titleCase(name);

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      cardBody.appendChild(title);

      for (const { label, color, tools } of TOOL_GROUPS) {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'text-body-secondary small mt-2 mb-1';
        groupLabel.textContent = label;

        const links = document.createElement('div');
        links.className = 'd-flex flex-wrap gap-2';
        for (const [text, path] of tools) {
          const a = document.createElement('a');
          a.className = `btn btn-sm btn-${color}`;
          a.href = `${path}?packetName=${name}`;
          a.textContent = text;
          links.appendChild(a);
        }

        cardBody.appendChild(groupLabel);
        cardBody.appendChild(links);
      }

      const card = document.createElement('div');
      card.className = 'card h-100';
      card.appendChild(cardBody);

      const col = document.createElement('div');
      col.className = 'col';
      col.appendChild(card);

      container.appendChild(col);
    });
  });
