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

document.getElementById('_id').textContent = bonus._id;
document.getElementById('difficulty').textContent = bonus.difficulty;
document.getElementById('standard').textContent = bonus.set.standard;
document.getElementById('time-created').textContent = mongoIdToDate(bonus._id).toLocaleString();
document.getElementById('last-modified').textContent = new window.Date(bonus.updatedAt).toLocaleString();

const { stats } = await fetch('/api/question-stats/bonus?' + new URLSearchParams({ _id: bonus._id })).then(response => response.json());

if (stats) {
  document.getElementById('bh').textContent = stats.count;
  document.getElementById('1st-part').textContent = (10 * stats.part1).toFixed(2) + ' pts';
  document.getElementById('2nd-part').textContent = (10 * stats.part2).toFixed(2) + ' pts';
  document.getElementById('3rd-part').textContent = (10 * stats.part3).toFixed(2) + ' pts';
  document.getElementById('30s').textContent = stats['30s'];
  document.getElementById('20s').textContent = stats['20s'];
  document.getElementById('10s').textContent = stats['10s'];
  document.getElementById('0s').textContent = stats['0s'];
  document.getElementById('total-points').textContent = stats.totalPoints;
  document.getElementById('ppb').textContent = stats.ppb.toFixed(2);
} else {
  document.getElementById('question-stats').textContent = 'No stats available for this question.';
}

document.getElementById('question-stats').classList.remove('d-none');
