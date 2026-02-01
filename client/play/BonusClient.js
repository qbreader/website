import addBonusGameCard from './bonuses/add-bonus-game-card.js';
import QuestionClient from './QuestionClient.js';
import { MODE_ENUM } from '../../quizbowl/constants.js';

export const BonusClientMixin = (ClientClass) => class extends ClientClass {
  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'end-current-bonus': return this.endCurrentBonus(data);
      case 'give-bonus-answer': return this.giveBonusAnswer(data);
      case 'reveal-leadin': return this.revealLeadin(data);
      case 'reveal-next-answer': return this.revealNextAnswer(data);
      case 'reveal-next-part': return this.revealNextPart(data);
      case 'start-bonus-answer': return this.startBonusAnswer(data);
      case 'start-next-bonus': return this.startNextBonus(data);
      case 'toggle-correct': return this.toggleCorrect(data);
      case 'toggle-three-part-bonuses': return this.toggleThreePartBonuses(data);
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
    document.getElementById('reveal').disabled = bonusEligibleTeamId !== this.room.players[this.USER_ID]?.teamId;

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

  toggleCorrect ({ partNumber, correct }) {
    document.getElementById(`checkbox-${partNumber + 1}`).checked = correct;
  }

  toggleThreePartBonuses ({ threePartBonuses }) {
    document.getElementById('toggle-three-part-bonuses').checked = threePartBonuses;
  }
};

const BonusClient = BonusClientMixin(QuestionClient);
export default BonusClient;
