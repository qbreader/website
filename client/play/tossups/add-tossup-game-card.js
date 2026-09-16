import star from '../../scripts/auth/star.js';
import { removeParentheses } from '../../../shared/string-utils.js';

/**
 * Creates a card for a tossup question and appends it to the room history element.
 * This differs from a TossupCard react component in that this is designed for game modes,
 * while the latter is designed for displaying tossups (e.g. in search results).
 * @param {Object} params
 * @param {string} [params.roomHistoryId='room-history'] - The id of the DOM element to prepend the card to.
 * @param {boolean} [params.starred] - Whether the tossup is starred. If not provided, this function will query the server.
 */
export default async function addTossupGameCard ({ roomHistoryId = 'room-history', starred, tossup }) {
  if (!tossup || Object.keys(tossup).length === 0) return;

  const { markedQuestion, answer, category, subcategory, alternate_subcategory: alternateSubcategory, set, packet, number, _id } = tossup;
  const now = new Date();
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const uniqueId = `${_id}-${secondsSinceMidnight}`;
  const questionId = `question-${uniqueId}`;
  const reportQuestionId = `report-question-${uniqueId}`;
  const starTossupId = `star-tossup-${uniqueId}`;

  starred = starred ?? await star.isStarredTossup(_id);

  // append a card containing the question to the history element
  const card = document.createElement('div');
  card.className = 'card my-2';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between">
      <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#${questionId}" aria-expanded="true">
        ${removeParentheses(answer)}
      </span>
      <a href="#" class="star-tossup ${starred ? 'selected' : ''}" id="${starTossupId}">
        ${starred ? star.starredSvg : star.unstarredSvg}
      </a>
    </div>
    <div class="card-container collapse" id="${questionId}">
      <div class="card-body">
        ${markedQuestion}
        <a class="user-select-none" href="#" id="${reportQuestionId}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
        <hr></hr>
        <div>ANSWER: ${answer}</div>
      </div>
      <div class="card-footer">
        <small class="text-muted">${set.name} / ${category} / ${subcategory}${alternateSubcategory ? ' / ' + alternateSubcategory : ''}</small>
        <small class="text-muted float-end">Packet ${packet.number} / Question ${number}</small>
      </div>
    </div>
  `;

  document.getElementById(roomHistoryId).prepend(card);

  document.getElementById(reportQuestionId).addEventListener('click', function () {
    document.getElementById('report-question-id').value = _id;
  });

  document.getElementById(starTossupId).addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.classList.contains('selected')) {
      this.innerHTML = star.unstarredSvg;
      star.unstarTossup(_id);
      this.classList.remove('selected');
    } else if (await star.starTossup(_id)) {
      this.innerHTML = star.starredSvg;
      this.classList.add('selected');
    }
  });
}
