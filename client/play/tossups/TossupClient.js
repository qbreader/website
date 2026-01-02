import addTossupGameCard from './add-tossup-game-card.js';
import QuestionClient from '../QuestionClient.js';
import audio from '../../audio/index.js';
import { MODE_ENUM } from '../../../quizbowl/constants.js';

export default class TossupClient extends QuestionClient {
  constructor (room, userId, socket) {
    super(room, userId, socket);
    attachEventListeners(room, socket);
  }

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

  next (data) {
    if (data.type !== 'start' && data.oldTossup) {
      addTossupGameCard({ starred: data.starred, tossup: data.oldTossup });
    }
    if (data.nextQuestion) { // just passing through, e.g. from a child class that handles bonus questions
      super.next(data);
    } else {
      this.nextTossup(data);
    }
  }

  nextTossup ({ tossup: nextTossup, oldTossup, packetLength, starred, type }) {
    super.next({ nextQuestion: nextTossup, packetLength, type });

    document.getElementById('answer').textContent = '';

    if (type === 'end') {
      document.getElementById('buzz').disabled = true;
    } else {
      document.getElementById('buzz').textContent = 'Buzz';
      document.getElementById('buzz').disabled = false;
      document.getElementById('pause').textContent = 'Pause';
      document.getElementById('pause').disabled = false;

      this.room.tossup = nextTossup;
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

function attachEventListeners (room, socket) {
  document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'buzz' });
    socket.sendToServer({ type: 'give-answer-live-update', givenAnswer: '' });
  });

  document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    const seconds = parseFloat(document.querySelector('.timer .face').textContent);
    const tenths = parseFloat(document.querySelector('.timer .fraction').textContent);
    const pausedTime = (seconds + tenths) * 10;
    socket.sendToServer({ type: 'pause', pausedTime });
  });

  document.getElementById('reading-speed').addEventListener('change', function () {
    socket.sendToServer({ type: 'set-reading-speed', readingSpeed: this.value });
  });

  document.getElementById('reading-speed').addEventListener('input', function () {
    document.getElementById('reading-speed-display').textContent = this.value;
  });

  document.getElementById('toggle-powermark-only').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'toggle-powermark-only', powermarkOnly: this.checked });
  });

  document.getElementById('toggle-rebuzz').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'toggle-rebuzz', rebuzz: this.checked });
  });
}
