import star from '../auth/star.js';
import { removeParentheses } from './strings.js';
import getBonusPartLabel from './get-bonus-part-label.js';

const starredSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
</svg>`;

const unstarredSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
  <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
</svg>`;

/**
 * See tossup-game-card.js for documentation.
 */
export default async function createBonusGameCard ({ bonus, starred }) {
  if (!bonus || Object.keys(bonus).length === 0) { return; }

  const { leadin, parts, answers, category, subcategory, alternate_subcategory: alternateSubcategory, set, packet, number, _id } = bonus;

  const bonusLength = bonus.parts.length;
  let cardBody = '';
  for (let i = 0; i < bonusLength; i++) {
    cardBody += `<hr></hr>
      <p>
        ${getBonusPartLabel(bonus, i)} ${parts[i]}
        ${i + 1 === bonusLength ? `<a class="user-select-none" href="#" id="report-question-${_id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>` : ''}
      </p>
      <div>ANSWER: ${answers[i]}</div>
    `;
  }

  starred = starred ?? await star.isStarredBonus(_id);

  // append a card containing the question to the history element
  const card = document.createElement('div');
  card.className = 'card my-2';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between">
      <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#question-${_id}" aria-expanded="true">
        ${answers.map(removeParentheses).join(' / ')}
      </span>
      <a href="#" class="star-bonus ${starred ? 'selected' : ''}" id="star-bonus-${_id}">
        ${starred ? starredSvg : unstarredSvg}
      </a>
    </div>
    <div class="card-container collapse" id="question-${_id}">
      <div class="card-body">
        <p>${leadin}</p>
        ${cardBody}
      </div>
      <div class="card-footer">
        <small class="text-muted">${set.name} / ${category} / ${subcategory}${alternateSubcategory ? ' / ' + alternateSubcategory : ''}</small>
        <small class="text-muted float-end">Packet ${packet.number} / Question ${number}</small>
      </div>
    </div>
  `;

  document.getElementById('room-history').prepend(card);

  document.getElementById('report-question-' + _id).addEventListener('click', () => {
    document.getElementById('report-question-id').value = _id;
  });

  document.getElementById('star-bonus-' + _id).addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.classList.contains('selected')) {
      this.innerHTML = unstarredSvg;
      star.unstarBonus(_id);
      this.classList.remove('selected');
    } else if (await star.starBonus(_id)) {
      this.innerHTML = starredSvg;
      this.classList.add('selected');
    }
  });
}
