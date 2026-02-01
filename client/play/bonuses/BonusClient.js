import addBonusGameCard from './add-bonus-game-card.js';
import QuestionClient from '../QuestionClient.js';
import { MODE_ENUM } from '../../../quizbowl/constants.js';

export default class BonusClient extends QuestionClient {
  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'end-current-bonus': return this.endCurrentBonus(data);
      case 'give-bonus-answer': return this.giveBonusAnswer(data);
      case 'start-next-bonus': return this.startNextBonus(data);
      default: return super.onmessage(message);
    }
  }

  endCurrentBonus ({ starred, bonus }) {
    addBonusGameCard({ starred, bonus });
  }

  giveBonusAnswer ({ currentPartNumber, directive, directedPrompt, userId }) {
    super.giveBonusAnswer({ directive, directedPrompt, userId });

    if (directive === 'accept') {
      document.getElementById(`checkbox-${currentPartNumber + 1}`).checked = true;
    }

    if (directive !== 'prompt') {
      document.getElementById('reveal').disabled = false;
    }
  }

  startNextBonus ({ bonus, packetLength }) {
    super.startNextQuestion({ packetLength, question: bonus });
    document.getElementById('next').textContent = 'Skip';
    document.getElementById('reveal').disabled = false;
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
