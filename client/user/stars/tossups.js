import { downloadQuestionsAsText, downloadTossupsAsCSV, downloadQuestionsAsJSON } from '../../scripts/download.js';
import star from '../../scripts/auth/star.js';
import renderPagination from '../../scripts/utilities/pagination.js';

const PAGE_SIZE = 20;

const tossups = await star.getStarredTossups();
const tossupList = document.getElementById('tossup-list');
const paginationContainer = document.getElementById('tossup-pagination');
document.getElementById('starred-number').innerText = tossups.length;

const totalPages = Math.max(1, Math.ceil(tossups.length / PAGE_SIZE));

function attachStarListener (tossup) {
  document.getElementById(`star-tossup-${tossup._id}`).addEventListener('click', async function () {
    if (this.classList.contains('selected')) {
      this.innerHTML = star.unstarredSvg;
      star.unstarTossup(tossup._id);
      this.classList.toggle('selected');
    } else if (await star.starTossup(tossup._id)) {
      this.innerHTML = star.starredSvg;
      this.classList.toggle('selected');
    }
  });
}

function renderPage (page) {
  const start = (page - 1) * PAGE_SIZE;
  const pageTossups = tossups.slice(start, start + PAGE_SIZE);

  tossupList.innerHTML = pageTossups.length > 0
    ? pageTossups.map(tossup => `
        <div class="card mb-2">
            <div class="card-header d-flex justify-content-between">
                <b class="clickable" data-bs-toggle="collapse" data-bs-target="#question-${tossup._id}" aria-expanded="true">
                    ${tossup.set.name} | ${tossup.category} | ${tossup.subcategory} ${tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | ${tossup.difficulty}
                </b>
                <a class="clickable selected" id="star-tossup-${tossup._id}">
                    ${star.starredSvg}
                </a>
            </div>
            <div class="card-container collapse show" id="question-${tossup._id}">
                <div class="card-body">
                    <span>${tossup.question}</span>&nbsp;
                    <hr></hr>
                    <div><b>ANSWER:</b> ${tossup.formatted_answer ?? tossup.answer}</div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">${tossup.packet.name ? 'Packet ' + tossup.packet.name : '&nbsp;'}</small>
                    <small class="text-muted float-end">
                        Packet ${tossup.packet.number} / Question ${tossup.number}
                    </small>
                </div>
            </div>
        </div>
    `).join('')
    : '<p class="text-muted">You have no starred tossups.</p>';

  for (const tossup of pageTossups) {
    attachStarListener(tossup);
  }

  renderPagination(paginationContainer, page, totalPages, goToPage);
}

function goToPage (page) {
  renderPage(page);
  tossupList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

renderPage(1);

document.getElementById('confirm').addEventListener('click', async function () {
  await star.clearStarredTossups();
  window.location.reload();
});

document.getElementById('download-questions-txt').addEventListener('click', function () {
  downloadQuestionsAsText({ tossups });
});
document.getElementById('download-questions-csv').addEventListener('click', function () {
  downloadTossupsAsCSV(tossups);
});
document.getElementById('download-questions-json').addEventListener('click', function () {
  downloadQuestionsAsJSON(tossups, []);
});
