import star from '../../scripts/auth/star.js';
import { removeParentheses } from '../../../shared/string-utils.js';
import getBonusPartLabel from '../../scripts/utilities/get-bonus-part-label.js';

/**
 * See tossup-game-card.js for documentation.
 */
export default async function addBonusGameCard ({ bonus, starred }) {
  if (!bonus || Object.keys(bonus).length === 0) { return; }

  const { leadin, parts, answers, category, subcategory, alternate_subcategory: alternateSubcategory, set, packet, number, _id } = bonus;
  const now = new Date();
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const uniqueId = `${_id}-${secondsSinceMidnight}`;
  const questionId = `question-${uniqueId}`;
  const reportQuestionId = `report-question-${uniqueId}`;
  const starBonusId = `star-bonus-${uniqueId}`;

  const bonusLength = bonus.parts.length;
  let cardBody = '';
  for (let i = 0; i < bonusLength; i++) {
    cardBody += `<hr></hr>
      <p>
        ${getBonusPartLabel(bonus, i)} ${parts[i]}
        ${i + 1 === bonusLength ? `<a class="user-select-none" href="#" id="${reportQuestionId}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>` : ''}
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
      <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#${questionId}" aria-expanded="true">
        ${answers.map(removeParentheses).join(' / ')}
      </span>
      <a href="#" class="star-bonus ${starred ? 'selected' : ''}" id="${starBonusId}">
        ${starred ? star.starredSvg : star.unstarredSvg}
      </a>
    </div>
    <div class="card-container collapse" id="${questionId}">
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

  document.getElementById(reportQuestionId).addEventListener('click', () => {
    document.getElementById('report-question-id').value = _id;
  });

  document.getElementById(starBonusId).addEventListener('click', async function (event) {
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
