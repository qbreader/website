import addTossupGameCard from './tossups/add-tossup-game-card.js';
import QuestionClient from './QuestionClient.js';
import audio from './audio.js';
import { MODE_ENUM } from '../../shared/constants.js';
import { TOSSUP_CLIENT_MESSAGE_TYPE, TOSSUP_ROOM_MESSAGE_TYPE } from '../../shared/protocol/tossup-room.js';

/**
 * @template {typeof QuestionClient} TBase
 * @param {TBase} ClientClass
 */
export const TossupClientMixin = (ClientClass) => class extends ClientClass {
  constructor (room, userId, socket) {
    super(room, userId, socket);
    attachEventListeners(room, socket);
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case TOSSUP_ROOM_MESSAGE_TYPE.BUZZ: return this.buzz(data);
      case TOSSUP_CLIENT_MESSAGE_TYPE.END_CURRENT_TOSSUP: return this.endCurrentTossup(data);
      case TOSSUP_CLIENT_MESSAGE_TYPE.GIVE_TOSSUP_ANSWER: return this.giveTossupAnswer(data);
      case TOSSUP_ROOM_MESSAGE_TYPE.PAUSE: return this.pause(data);
      case TOSSUP_CLIENT_MESSAGE_TYPE.REVEAL_TOSSUP_ANSWER: return this.revealTossupAnswer(data);
      case TOSSUP_CLIENT_MESSAGE_TYPE.START_NEXT_TOSSUP: return this.startNextTossup(data);
      case TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_POWERMARK_ONLY: return this.togglePowermarkOnly(data);
      case TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_REBUZZ: return this.toggleRebuzz(data);
      case TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_STOP_ON_POWER: return this.toggleStopOnPower(data);
      case TOSSUP_CLIENT_MESSAGE_TYPE.UPDATE_QUESTION: return this.updateQuestion(data);
      default: return super.onmessage(message);
    }
  }

  buzz ({ userId }) {
    document.getElementById('buzz').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('pause').disabled = true;
    if (userId === this.USER_ID && audio.soundEffects) { audio.buzz.play(); }
  }

  endCurrentTossup ({ starred, tossup }) {
    addTossupGameCard({ starred, tossup });
  }

  giveTossupAnswer ({ directive, directedPrompt, score, userId }) {
    super.giveAnswer({ directive, directedPrompt, score, userId });

    if (directive !== 'prompt') {
      document.getElementById('next').disabled = false;
    }
  }

  pause ({ paused }) {
    const icon = document.getElementById('pause').querySelector('i');
    if (icon) { icon.className = paused ? 'bi bi-play-fill' : 'bi bi-pause-fill'; }
  }

  revealTossupAnswer ({ answer, question }) {
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

  startNextTossup ({ tossup, packetLength }) {
    this.startNextQuestion({ question: tossup, packetLength });
    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('pause').disabled = false;
    this.pause({ paused: false });
    this.room.tossup = tossup;
  }

  togglePowermarkOnly ({ powermarkOnly }) {
    document.getElementById('toggle-powermark-only').checked = powermarkOnly;
  }

  toggleRebuzz ({ rebuzz }) {
    document.getElementById('toggle-rebuzz').checked = rebuzz;
  }

  toggleStopOnPower ({ stopOnPower }) {
    document.getElementById('toggle-stop-on-power').checked = stopOnPower;
  }

  updateQuestion ({ word }) {
    if (word === '(*)' || word === '[*]' || word === '(+)') { return; }
    document.getElementById('question').innerHTML += word + ' ';
  }
};

function attachEventListeners (room, socket) {
  document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: TOSSUP_ROOM_MESSAGE_TYPE.BUZZ });
    socket.sendToServer({ type: TOSSUP_CLIENT_MESSAGE_TYPE.GIVE_ANSWER_LIVE_UPDATE, givenAnswer: '' });
  });

  document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    const seconds = parseFloat(document.querySelector('.timer .face').textContent);
    const tenths = parseFloat(document.querySelector('.timer .fraction').textContent);
    const pausedTime = (seconds + tenths) * 10;
    socket.sendToServer({ type: TOSSUP_ROOM_MESSAGE_TYPE.PAUSE, pausedTime });
  });

  document.getElementById('toggle-powermark-only').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_POWERMARK_ONLY, powermarkOnly: this.checked });
  });

  document.getElementById('toggle-rebuzz').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_REBUZZ, rebuzz: this.checked });
  });

  document.getElementById('toggle-stop-on-power').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_STOP_ON_POWER, stopOnPower: this.checked });
  });
}

const TossupClient = TossupClientMixin(QuestionClient);
export default TossupClient;
