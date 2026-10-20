import account from '../../scripts/accounts.js';
import { titleCase } from '../../../shared/string-utils.js';

account.getUsername().then(username => {
  if (username) {
    document.getElementById('login-warning').classList.add('d-none');
  }
});

fetch('/api/geoword/has-admin-access')
  .then(response => response.json())
  .then(data => {
    if (data.hasAdminAccess) {
      document.getElementById('admin-link-container').classList.remove('d-none');
    }
  });

fetch('/api/geoword/packet-list')
  .then(response => response.json())
  .then(data => {
    const { packetList } = data;
    packetList.forEach(game => {
      const a = document.createElement('a');
      a.href = './' + (game.costInCents ? 'payment' : 'division/') + '?packetName=' + game.name;
      a.textContent = titleCase(game.name);

      const li = document.createElement('li');
      li.appendChild(a);

      document.getElementById('packet-list').appendChild(li);
    });
  });
