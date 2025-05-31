import star from '../auth/star.js';
import { removeParentheses } from './strings.js';
import getBonusPartLabel from './get-bonus-part-label.js';

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
        ${starred ? star.starredSvg : star.unstarredSvg}
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
      this.innerHTML = star.unstarredSvg;
      star.unstarBonus(_id);
      this.classList.remove('selected');
    } else if (await star.starBonus(_id)) {
      this.innerHTML = star.starredSvg;
      this.classList.add('selected');
    }
  });
}
