import audio from '../audio/index.js';
import { MODE_ENUM } from '../../quizbowl/constants.js';
import createTossupGameCard from '../scripts/utilities/tossup-game-card.js';
import QuestionClient from './QuestionClient.js';

export default class TossupClient extends QuestionClient {
  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'buzz': return this.buzz(data);
      case 'pause': return this.pause(data);
      case 'reveal-answer': return this.revealAnswer(data);
      case 'set-reading-speed': return this.setReadingSpeed(data);
      case 'toggle-powermark-only': return this.togglePowermarkOnly(data);
      case 'toggle-rebuzz': return this.toggleRebuzz(data);
      case 'update-question': return this.updateQuestion(data);
      default: return super.onmessage(message);
    }
  }

  buzz ({ userId }) {
    document.getElementById('buzz').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('pause').disabled = true;
    if (userId === this.USER_ID && audio.soundEffects) { audio.buzz.play(); }
  }

  giveAnswer ({ directive, directedPrompt, score, userId }) {
    super.giveAnswer({ directive, directedPrompt, score, userId });

    if (directive !== 'prompt') {
      document.getElementById('next').disabled = false;
    }
  }

  next ({ nextTossup, oldTossup, packetLength, starred, type }) {
    super.next({ nextQuestion: nextTossup, packetLength, type });

    document.getElementById('answer').textContent = '';

    if (type !== 'start') {
      createTossupGameCard({ starred, tossup: oldTossup });
    }

    if (type === 'end') {
      document.getElementById('buzz').disabled = true;
    } else {
      document.getElementById('buzz').textContent = 'Buzz';
      document.getElementById('buzz').disabled = false;
      document.getElementById('pause').textContent = 'Pause';
      document.getElementById('pause').disabled = false;
    }
  }

  pause ({ paused }) {
    document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
  }

  revealAnswer ({ answer, question }) {
    document.getElementById('question').innerHTML = question;
    document.getElementById('answer').innerHTML = 'ANSWER: ' + answer;
    document.getElementById('pause').disabled = true;
  }

  setMode ({ mode }) {
    super.setMode({ mode });
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document.getElementById('toggle-powermark-only').disabled = true;
        document.getElementById('toggle-standard-only').disabled = true;
        break;
      case MODE_ENUM.RANDOM:
        document.getElementById('toggle-powermark-only').disabled = false;
        document.getElementById('toggle-standard-only').disabled = false;
        break;
    }
  }

  setReadingSpeed ({ readingSpeed }) {
    document.getElementById('reading-speed').value = readingSpeed;
    document.getElementById('reading-speed-display').textContent = readingSpeed;
  }

  togglePowermarkOnly ({ powermarkOnly }) {
    document.getElementById('toggle-powermark-only').checked = powermarkOnly;
  }

  toggleRebuzz ({ rebuzz }) {
    document.getElementById('toggle-rebuzz').checked = rebuzz;
  }

  updateQuestion ({ word }) {
    if (word === '(*)' || word === '[*]') { return; }
    document.getElementById('question').innerHTML += word + ' ';
  }
}
