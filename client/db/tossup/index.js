import mongoIdToDate from '../mongo-id-to-date.js';
import tossupToHTML from '../tossup-to-html.js';

const tossupId = new URLSearchParams(window.location.search).get('_id');
const { tossup } = await fetch('/api/tossup?' + new URLSearchParams({ _id: tossupId })).then(res => res.json());

document.getElementById('spinner').classList.add('d-none');

document.getElementById('packet-link').href = `../packet/?_id=${tossup.packet._id}`;
document.getElementById('packet-number').textContent = tossup.packet.number;
document.getElementById('packet-name').textContent = tossup.packet.name;

document.getElementById('set-name').href = `../set/?_id=${tossup.set._id}`;
document.getElementById('set-name').textContent = tossup.set.name;

document.getElementById('tossup').appendChild(tossupToHTML(tossup));

document.getElementById('_id').textContent = tossup._id;
document.getElementById('difficulty').textContent = tossup.difficulty;
document.getElementById('standard').textContent = tossup.set.standard;
document.getElementById('time-created').textContent = mongoIdToDate(tossup._id).toLocaleString();
document.getElementById('last-modified').textContent = new window.Date(tossup.updatedAt).toLocaleString();

const { stats } = await fetch('/api/question-stats/tossup?' + new URLSearchParams({ _id: tossup._id })).then(response => response.json());

if (stats) {
  document.getElementById('tuh').textContent = stats.count;

  for (const [pointValue, count] of Object.entries(stats.resultCounts).sort((a, b) => b[0] - a[0])) {
    const pointValueElement = document.createElement('div');
    pointValueElement.innerHTML = `<b>${pointValue}s:</b> ${count}`;
    document.getElementById('result-counts').appendChild(pointValueElement);
  }

  const averageCelerity = stats.numCorrect > 0 ? (stats.totalCorrectCelerity / stats.numCorrect) : 0;
  document.getElementById('average-celerity').textContent = averageCelerity.toFixed(3);
  document.getElementById('total-points').textContent = stats.totalPoints;
  document.getElementById('pptu').textContent = stats.pptu.toFixed(2);
} else {
  document.getElementById('question-stats').textContent = 'No stats available for this question.';
}

document.getElementById('question-stats').classList.remove('d-none');
