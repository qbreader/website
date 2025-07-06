import { MODE_ENUM } from '../../quizbowl/constants.js';
import createBonusGameCard from '../scripts/utilities/bonus-game-card.js';
import QuestionClient from './QuestionClient.js';

export default class BonusClient extends QuestionClient {
  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      default: return super.onmessage(message);
    }
  }

  giveAnswer ({ currentPartNumber, directive, directedPrompt, userId }) {
    super.giveAnswer({ directive, directedPrompt, userId });

    if (directive === 'accept') {
      document.getElementById(`checkbox-${currentPartNumber + 1}`).checked = true;
    }

    if (directive !== 'prompt') {
      document.getElementById('reveal').disabled = false;
    }
  }

  next ({ bonus, oldBonus, packetLength, starred, type }) {
    super.next({ nextQuestion: bonus, packetLength, type });

    if (type !== 'start') {
      createBonusGameCard({ bonus: oldBonus, starred });
    }

    if (type === 'end') {
      document.getElementById('next').disabled = true;
      document.getElementById('reveal').disabled = true;
    } else {
      document.getElementById('next').textContent = 'Skip';
      document.getElementById('reveal').disabled = false;
    }
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
}
