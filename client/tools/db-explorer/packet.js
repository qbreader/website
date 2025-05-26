import { tossupToHTML, bonusToHTML } from './utilities.js';

const packetId = new URLSearchParams(window.location.search).get('_id');

const { tossups, bonuses, packet } = await fetch('/api/packet?' + new URLSearchParams({ _id: packetId })).then(res => res.json());

document.getElementById('spinner').classList.add('d-none');

document.getElementById('packet-name').textContent = packet.name;
document.getElementById('packet-number').textContent = packet.number;
document.getElementById('set-name').textContent = packet.set.name;
document.getElementById('set-name').href = './set?_id=' + packet.set._id;

for (const tossup of tossups) {
  const div = tossupToHTML(tossup);
  div.classList.add('mb-2');
  const container = document.getElementById('questions');
  container.appendChild(div);
  const a = getQuestionLink('tossup', tossup._id);
  div.appendChild(a);
  container.appendChild(document.createElement('hr'));
}

for (const bonus of bonuses) {
  const div = bonusToHTML(bonus);
  div.classList.add('mb-2');
  const container = document.getElementById('questions');
  container.appendChild(div);
  const a = getQuestionLink('bonus', bonus._id);
  div.appendChild(a);
  container.appendChild(document.createElement('hr'));
}

function getQuestionLink (type, _id) {
  const a = document.createElement('a');
  a.href = `./${type}?_id=${_id}`;
  a.textContent = ` Link to ${type}`;
  return a;
}
