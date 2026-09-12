import addBonusGameCard from './bonuses/add-bonus-game-card.js';
import QuestionClient from './QuestionClient.js';
import { MODE_ENUM } from '../../shared/constants.js';
import { BONUS_CLIENT_MESSAGE_TYPE, BONUS_ROOM_MESSAGE_TYPE } from '../../shared/protocol/bonus-room.js';

/**
 * @template {typeof QuestionClient} TBase
 * @param {TBase} ClientClass
 */
export const BonusClientMixin = (ClientClass) => class extends ClientClass {
  constructor (room, userId, socket) {
    super(room, userId, socket);
    attachEventListeners(room, socket);
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case BONUS_CLIENT_MESSAGE_TYPE.END_CURRENT_BONUS: return this.endCurrentBonus(data);
      case BONUS_CLIENT_MESSAGE_TYPE.GIVE_BONUS_ANSWER: return this.giveBonusAnswer(data);
      case BONUS_CLIENT_MESSAGE_TYPE.REVEAL_LEADIN: return this.revealLeadin(data);
      case BONUS_CLIENT_MESSAGE_TYPE.REVEAL_NEXT_ANSWER: return this.revealNextAnswer(data);
      case BONUS_CLIENT_MESSAGE_TYPE.REVEAL_NEXT_PART: return this.revealNextPart(data);
      case BONUS_ROOM_MESSAGE_TYPE.START_BONUS_ANSWER: return this.startBonusAnswer(data);
      case BONUS_CLIENT_MESSAGE_TYPE.START_NEXT_BONUS: return this.startNextBonus(data);
      case BONUS_ROOM_MESSAGE_TYPE.TOGGLE_BONUS_PART: return this.toggleBonusPart(data);
      case BONUS_ROOM_MESSAGE_TYPE.TOGGLE_READ_BONUSES_LIKE_TOSSUPS: return this.toggleReadBonusesLikeTossups(data);
      case BONUS_ROOM_MESSAGE_TYPE.TOGGLE_THREE_PART_BONUSES: return this.toggleThreePartBonuses(data);
      case BONUS_CLIENT_MESSAGE_TYPE.UPDATE_BONUS_QUESTION: return this.updateBonusQuestion(data);
      default: return super.onmessage(message);
    }
  }

  endCurrentBonus ({ bonus, starred }) {
    addBonusGameCard({ bonus, starred });
  }

  giveBonusAnswer ({ currentPartNumber, directive, directedPrompt, userId }) {
    super.giveAnswer({ directive, directedPrompt, userId });

    if (directive === 'accept') {
      document.getElementById(`checkbox-${currentPartNumber + 1}`).checked = true;
    }

    if (directive !== 'prompt') {
      document.getElementById('reveal').disabled = false;
    }
  }

  revealLeadin ({ leadin }) {
    const paragraph = document.createElement('p');
    paragraph.id = 'leadin';
    paragraph.innerHTML = leadin;
    document.getElementById('question').appendChild(paragraph);
  }

  revealNextAnswer ({ answer, currentPartNumber, lastPartRevealed }) {
    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'ANSWER: ' + answer;
    document.getElementById(`bonus-part-${currentPartNumber + 1}`).appendChild(paragraph);

    if (lastPartRevealed) {
      document.getElementById('reveal').disabled = true;
      document.getElementById('next').textContent = 'Next';
    }
  }

  revealNextPart ({ bonusEligibleTeamId, currentPartNumber, part, value }) {
    document.getElementById('reveal').disabled = !(
      bonusEligibleTeamId === undefined ||
      bonusEligibleTeamId === this.room.players[this.USER_ID]?.teamId
    );

    const input = document.createElement('input');
    input.id = `checkbox-${currentPartNumber + 1}`;
    input.className = 'checkbox form-check-input rounded-0 me-1';
    input.type = 'checkbox';
    input.style = 'width: 20px; height: 20px; cursor: pointer';

    const inputWrapper = document.createElement('label');
    inputWrapper.style = 'cursor: pointer';
    inputWrapper.appendChild(input);

    const p = document.createElement('p');
    p.innerHTML = `[${value}] ${part}`;

    const bonusPart = document.createElement('div');
    bonusPart.id = `bonus-part-${currentPartNumber + 1}`;
    bonusPart.appendChild(p);

    const row = document.createElement('div');
    row.className = 'd-flex';
    row.appendChild(inputWrapper);
    row.appendChild(bonusPart);

    document.getElementById('question').appendChild(row);
  }

  startBonusAnswer () {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('reveal').disabled = true;
  }

  startNextBonus ({ bonus, packetLength }) {
    this.startNextQuestion({ packetLength, question: bonus });
    document.getElementById('next').textContent = 'Skip';
  }

  setMode ({ mode }) {
    super.setMode({ mode });
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document.getElementById('toggle-standard-only').disabled = true;
        document.getElementById('toggle-three-part-bonuses').disabled = true;
        break;
      case MODE_ENUM.RANDOM:
        document.getElementById('toggle-standard-only').disabled = false;
        document.getElementById('toggle-three-part-bonuses').disabled = false;
        break;
    }
  }

  toggleBonusPart ({ partNumber, correct }) {
    document.getElementById(`checkbox-${partNumber + 1}`).checked = correct;
  }

  toggleThreePartBonuses ({ threePartBonuses }) {
    document.getElementById('toggle-three-part-bonuses').checked = threePartBonuses;
  }

  toggleReadBonusesLikeTossups ({ readBonusLikeATossup }) {
    document.getElementById('toggle-read-bonuses-like-tossups').checked = readBonusLikeATossup;
    document.getElementById('reading-speed-container').classList.toggle('d-none', !readBonusLikeATossup);
  }

  updateBonusQuestion ({ word, currentPartNumber }) {
    if (currentPartNumber === -1) {
      document.getElementById('leadin').innerHTML += word + ' ';
    } else {
      document.getElementById(`bonus-part-${currentPartNumber + 1}`).querySelector('p').innerHTML += word + ' ';
    }
  }
};

function attachEventListeners (room, socket) {
  document.getElementById('reveal').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: BONUS_ROOM_MESSAGE_TYPE.START_BONUS_ANSWER });
  });
}

const BonusClient = BonusClientMixin(QuestionClient);
export default BonusClient;
