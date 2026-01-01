import bonusToHTML from '../bonus-to-html.js';
import mongoIdToDate from '../mongo-id-to-date.js';

const bonusId = new URLSearchParams(window.location.search).get('_id');
const { bonus } = await fetch('/api/bonus?' + new URLSearchParams({ _id: bonusId })).then(res => res.json());

document.getElementById('spinner').classList.add('d-none');

document.getElementById('packet-link').href = `../packet/?_id=${bonus.packet._id}`;
document.getElementById('packet-number').textContent = bonus.packet.number;
document.getElementById('packet-name').textContent = bonus.packet.name;

document.getElementById('set-name').href = `../set/?_id=${bonus.set._id}`;
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

  for (const [i, part] of stats.partConversion.entries()) {
    const partDiv = document.createElement('div');
    partDiv.innerHTML = `<b>Part ${i + 1}:</b> ${(10 * part).toFixed(2)} pts`;
    document.getElementById('part-conversion').appendChild(partDiv);
  }

  const resultCountsKeys = Object.keys(stats.resultCounts).sort((a, b) => b - a);
  document.getElementById('result-counts-label').textContent = resultCountsKeys.map(key => `${key}s`).join('/') + ':';
  document.getElementById('result-counts').textContent = resultCountsKeys.map(key => stats.resultCounts[key]).join('/');

  document.getElementById('total-points').textContent = stats.totalPoints;
  document.getElementById('ppb').textContent = stats.ppb.toFixed(2);
} else {
  document.getElementById('question-stats').textContent = 'No stats available for this question.';
}

document.getElementById('question-stats').classList.remove('d-none');
