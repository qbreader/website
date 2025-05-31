import star from '../auth/star.js';
import { removeParentheses } from './strings.js';

/**
 * Creates a card for a tossup question and appends it to the room history element.
 * This differs from a TossupCard react component in that this is designed for game modes,
 * while the latter is designed for displaying tossups (e.g. in search results).
 * @param {Object} params
 * @param {string} [params.roomHistoryId='room-history'] - The id of the DOM element to prepend the card to.
 * @param {boolean} [params.starred] - Whether the tossup is starred. If not provided, this function will query the server.
 */
export default async function createTossupGameCard ({ roomHistoryId = 'room-history', starred, tossup }) {
  if (!tossup || Object.keys(tossup).length === 0) return;

  const { markedQuestion, answer, category, subcategory, alternate_subcategory: alternateSubcategory, set, packet, number, _id } = tossup;

  starred = starred ?? await star.isStarredTossup(_id);

  // append a card containing the question to the history element
  const card = document.createElement('div');
  card.className = 'card my-2';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between">
      <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#question-${_id}" aria-expanded="true">
        ${removeParentheses(answer)}
      </span>
      <a href="#" class="star-tossup ${starred ? 'selected' : ''}" id="star-tossup-${_id}">
        ${starred ? star.starredSvg : star.unstarredSvg}
      </a>
    </div>
    <div class="card-container collapse" id="question-${_id}">
      <div class="card-body">
        ${markedQuestion}
        <a class="user-select-none" href="#" id="report-question-${_id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
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

  document.getElementById('report-question-' + _id).addEventListener('click', function () {
    document.getElementById('report-question-id').value = _id;
  });

  document.getElementById('star-tossup-' + _id).addEventListener('click', async function (event) {
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
