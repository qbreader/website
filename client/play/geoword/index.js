import account from '../../scripts/accounts.js';
import { titleCase } from '../../scripts/utilities/strings.js';

account.getUsername().then(username => {
  if (username) {
    document.getElementById('login-warning').classList.add('d-none');
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
