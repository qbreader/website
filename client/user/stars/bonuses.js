import { downloadQuestionsAsText, downloadBonusesAsCSV, downloadQuestionsAsJSON } from '../../scripts/download.js';
import star from '../../scripts/auth/star.js';
import getBonusPartLabel from '../../scripts/utilities/get-bonus-part-label.js';
import renderPagination from '../../scripts/utilities/pagination.js';

const PAGE_SIZE = 20;

const bonuses = await star.getStarredBonuses();
const bonusList = document.getElementById('bonus-list');
const paginationContainer = document.getElementById('bonus-pagination');
document.getElementById('starred-number').innerText = bonuses.length;

const totalPages = Math.max(1, Math.ceil(bonuses.length / PAGE_SIZE));

function attachStarListener (bonus) {
  document.getElementById(`star-bonus-${bonus._id}`).addEventListener('click', async function () {
    if (this.classList.contains('selected')) {
      this.innerHTML = star.unstarredSvg;
      star.unstarBonus(bonus._id);
      this.classList.toggle('selected');
    } else if (await star.starBonus(bonus._id)) {
      this.innerHTML = star.starredSvg;
      this.classList.toggle('selected');
    }
  });
}

function renderBonusCard (bonus) {
  let cardBody = '';
  for (let i = 0; i < bonus.parts.length; i++) {
    cardBody += `
        <hr></hr>
        <p>${getBonusPartLabel(bonus, i)} ${bonus.parts[i]}</p>
        <div>ANSWER: ${bonus.answers[i]}</div>
    `;
  }

  return `
        <div class="card my-2">
            <div class="card-header d-flex justify-content-between">
                <b class="clickable" data-bs-toggle="collapse" data-bs-target="#question-${bonus._id}" aria-expanded="true">
                    ${bonus.set.name} | ${bonus.category} | ${bonus.subcategory} ${bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | ${bonus.difficulty}
                </b>
                <a class="clickable selected" id="star-bonus-${bonus._id}">
                    ${star.starredSvg}
                </a>
            </div>
            <div class="card-container collapse show" id=question-${bonus._id}>
                <div class="card-body">
                    <p>${bonus.leadin}</p>
                    ${cardBody}
                </div>
                <div class="card-footer clickable" data-bs-toggle="modal" data-bs-target="#bonus-stats-modal">
                    <small class="text-muted">${bonus.packet.name ? 'Packet ' + bonus.packet.name : '&nbsp;'}</small>
                    <small class="text-muted float-end">
                        Packet ${bonus.packet.number} / Question ${bonus.number}
                    </small>
                </div>
            </div>
        </div>
    `;
}

function renderPage (page) {
  const start = (page - 1) * PAGE_SIZE;
  const pageBonuses = bonuses.slice(start, start + PAGE_SIZE);

  bonusList.innerHTML = pageBonuses.length > 0
    ? pageBonuses.map(renderBonusCard).join('')
    : '<p class="text-muted">You have no starred bonuses.</p>';

  for (const bonus of pageBonuses) {
    attachStarListener(bonus);
  }

  renderPagination(paginationContainer, page, totalPages, goToPage);
}

function goToPage (page) {
  renderPage(page);
  bonusList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

renderPage(1);

document.getElementById('confirm').addEventListener('click', async function () {
  await star.clearStarredBonuses();
  window.location.reload();
});

document.getElementById('download-questions-txt').addEventListener('click', function () {
  downloadQuestionsAsText({ bonuses });
});
document.getElementById('download-questions-csv').addEventListener('click', function () {
  downloadBonusesAsCSV(bonuses);
});
document.getElementById('download-questions-json').addEventListener('click', function () {
  downloadQuestionsAsJSON([], bonuses);
});
