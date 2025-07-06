import audio from '../audio/index.js';
import { MODE_ENUM } from '../../quizbowl/constants.js';
import createTossupGameCard from '../scripts/utilities/tossup-game-card.js';
import QuestionClient from './QuestionClient.js';

export default class TossupClient extends QuestionClient {
  onmessage (message) {
    const data = JSON.parse(message.data);
    switch (data.type) {
      case 'buzz': return this.buzz(data);
      case 'end': return this.next(data);
      case 'give-answer': return this.giveAnswer(data);
      case 'next': return this.next(data);
      case 'pause': return this.pause(data);
      case 'set-reading-speed': return this.setReadingSpeed(data);
      case 'skip': return this.next(data);
      case 'start': return this.next(data);
      case 'toggle-powermark-only': return this.togglePowermarkOnly(data);
      case 'toggle-rebuzz': return this.toggleRebuzz(data);
      default: super.onmessage(message);
    }
  }

  buzz () {
    document.getElementById('buzz').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('pause').disabled = true;
    if (audio.soundEffects) { audio.buzz.play(); }
  }

  giveAnswer ({ directive, directedPrompt, score, userId }) {
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').blur();
    document.getElementById('answer-input').placeholder = 'Enter answer';
    document.getElementById('answer-input-group').classList.add('d-none');

    if (directive === 'prompt' && userId === this.USER_ID) {
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
      document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    }

    if (audio.soundEffects && userId === this.USER_ID) {
      if (directive === 'accept' && score > 10) {
        audio.power.play();
      } else if (directive === 'accept' && score === 10) {
        audio.correct.play();
      } else if (directive === 'reject') {
        audio.incorrect.play();
      }
    }

    if (directive !== 'prompt') {
      document.getElementById('next').disabled = false;
    }
  }

  next ({ nextTossup, oldTossup, packetLength, starred, type }) {
    document.getElementById('answer').textContent = '';
    document.getElementById('question').textContent = '';
    document.getElementById('settings').classList.add('d-none');

    if (type !== 'start') {
      createTossupGameCard({ starred, tossup: oldTossup });
    }

    if (type === 'end') {
      document.getElementById('buzz').disabled = true;
    } else {
      document.getElementById('buzz').textContent = 'Buzz';
      document.getElementById('buzz').disabled = false;
      document.getElementById('packet-number-info').textContent = nextTossup?.packet.number;
      document.getElementById('packet-length-info').textContent = this.room.mode === MODE_ENUM.SET_NAME ? packetLength : '-';
      document.getElementById('pause').textContent = 'Pause';
      document.getElementById('pause').disabled = false;
      document.getElementById('question-number-info').textContent = nextTossup?.number;
      document.getElementById('set-name-info').textContent = nextTossup?.set.name;
    }
  }

  pause ({ paused }) {
    document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
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
}
