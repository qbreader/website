import TossupClient from '../tossups/TossupClient.js';
import addBonusGameCard from '../bonuses/add-bonus-game-card.js';

export default class TossupBonusClient extends TossupClient {
  // constructor (room, userId, socket) {
  //   super(room, userId, socket);
  // }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'reveal-leadin': return this.revealLeadin(data);
      case 'reveal-next-answer': return this.revealNextAnswer(data);
      case 'reveal-next-part': return this.revealNextPart(data);
      case 'start-answer': return this.startAnswer(data);
      default: return super.onmessage(message);
    }
  }

  next (data) {
    if (data.bonus) {
      super.next({ oldTossup: data.oldTossup, nextQuestion: data.bonus, packetLength: data.packetLength, type: data.type });
      document.getElementById('answer').textContent = '';

      if (data.type === 'end') {
        document.getElementById('next').disabled = true;
        document.getElementById('reveal').disabled = true;
        document.getElementById('buzz').disabled = false;
      } else {
        document.getElementById('reveal').disabled = false;
        document.getElementById('buzz').disabled = true;
      }
    } else {
      if (data.type !== 'start' && data.oldBonus) {
        addBonusGameCard({ bonus: data.oldBonus, starred: data.starred });
      }

      super.next(data);
    }
  }

  revealNextAnswer ({ answer, currentPartNumber, lastPartRevealed }) {
    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'ANSWER: ' + answer;
    document.getElementById(`bonus-part-${currentPartNumber + 1}`).appendChild(paragraph);

    if (lastPartRevealed) {
      document.getElementById('reveal').disabled = true;
      document.getElementById('next').disabled = false;
    }
  }

  giveAnswer (data) {
    const { directive, directedPrompt, score, userId } = data;
    super.giveAnswer({ directive, directedPrompt, score, userId });

    if (data.currentPartNumber !== undefined) {
      const currentPartNumber = data.currentPartNumber;

      if (directive === 'accept') {
        document.getElementById(`checkbox-${currentPartNumber + 1}`).checked = true;
      }
    }
  }

  startAnswer (data) {
    const { userId } = data;

    // Only show answer input for the user who can answer the bonus
    if (userId === this.USER_ID) {
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
    }

    document.getElementById('reveal').disabled = true;
  }

  revealLeadin ({ leadin }) {
    const paragraph = document.createElement('p');
    paragraph.id = 'leadin';
    paragraph.innerHTML = leadin;
    document.getElementById('question').appendChild(paragraph);
  }

  revealNextPart ({ currentPartNumber, part, value, bonusEligibleUserId }) {
    // Only enable Reveal button for the user who can answer the bonus
    document.getElementById('reveal').disabled = (bonusEligibleUserId !== this.USER_ID);

    const input = document.createElement('input');
    input.id = `checkbox-${currentPartNumber + 1}`;
    input.className = 'checkbox form-check-input rounded-0 me-1';
    input.type = 'checkbox';
    input.disabled = true;
    input.style = 'width: 20px; height: 20px; cursor: not-allowed';

    const inputWrapper = document.createElement('label');
    inputWrapper.style = 'cursor: default';
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
}
