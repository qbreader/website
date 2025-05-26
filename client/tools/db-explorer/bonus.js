import { bonusToHTML, mongoIdToDate } from './utilities.js';

const bonusId = new URLSearchParams(window.location.search).get('_id');
const { bonus } = await fetch('/api/bonus-by-id?' + new URLSearchParams({ id: bonusId })).then(res => res.json());

document.getElementById('spinner').classList.add('d-none');

document.getElementById('packet-link').href = `./packet?_id=${bonus.packet._id}`;
document.getElementById('packet-number').textContent = bonus.packet.number;
document.getElementById('packet-name').textContent = bonus.packet.name;

document.getElementById('set-name').href = `./set?_id=${bonus.set._id}`;
document.getElementById('set-name').textContent = bonus.set.name;

document.getElementById('bonus').appendChild(bonusToHTML(bonus));

document.getElementById('difficulty').textContent = bonus.difficulty;
document.getElementById('standard').textContent = bonus.set.standard;
document.getElementById('time-created').textContent = mongoIdToDate(bonus._id).toLocaleString();
document.getElementById('last-modified').textContent = new window.Date(bonus.updatedAt).toLocaleString();
