import { MODE_ENUM } from '../../quizbowl/constants.js';
import account from '../scripts/accounts.js';
import audio from '../audio/index.js';
import { arrayToRange, rangeToArray } from './ranges.js';
import getSetList from '../scripts/api/get-set-list.js';
import reportQuestion from '../scripts/api/report-question.js';
import { addSliderEventListeners, setYear } from './year-slider.js';

const SET_LIST = await getSetList();
document.getElementById('set-list').innerHTML = SET_LIST.map(setName => `<option>${setName}</option>`).join('');

export default class QuestionClient {
  constructor (room, userId, socket) {
    this.room = room;
    this.USER_ID = userId;
    attachEventListeners(room, socket);
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'alert': return window.alert(data.message);
      case 'end-of-set': return this.endOfSet(data);
      case 'no-questions-found': return this.noQuestionsFound(data);
      case 'set-categories': return this.setCategories(data);
      case 'set-difficulties': return this.setDifficulties(data);
      case 'set-mode': return this.setMode(data);
      case 'set-packet-numbers': return this.setPacketNumbers(data);
      case 'set-set-name': return this.setSetName(data);
      case 'set-strictness': return this.setStrictness(data);
      case 'set-max-year': return this.setMaxYear(data);
      case 'set-min-year': return this.setMinYear(data);
      case 'timer-update': return this.timerUpdate(data);
      case 'toggle-skip': return this.toggleSkip(data);
      case 'toggle-standard-only': return this.toggleStandardOnly(data);
      case 'toggle-timer': return this.toggleTimer(data);
    }
  }

  endOfSet () {
    window.alert('You have reached the end of the set');
  }

  giveBonusAnswer ({ directive, directedPrompt, score, userId }) {
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
      if (directive === 'accept' && score && score > 10) {
        audio.power.play();
      } else if (directive === 'accept') {
        audio.correct.play();
      } else if (directive === 'reject') {
        audio.incorrect.play();
      }
    }
  }

  noQuestionsFound () {
    window.alert('No questions found');
  }

  setCategories () {
    this.room.categoryManager.loadCategoryModal();
  }

  setDifficulties () {
    throw new Error('Not implemented');
  }

  setMode ({ mode }) {
    document.getElementById('set-mode').value = mode;
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        break;
      case MODE_ENUM.RANDOM:
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        break;
    }
  }

  setPacketNumbers ({ packetNumbers }) {
    document.getElementById('packet-number').value = arrayToRange(packetNumbers);
  }

  setSetName ({ setName, setLength }) {
    document.getElementById('set-name').value = setName;
    // make border red if set name is not in set list
    const valid = !setName || SET_LIST.includes(setName);
    document.getElementById('packet-number').placeholder = 'Packet Numbers' + (setLength ? ` (1-${setLength})` : '');
    document.getElementById('set-name').classList.toggle('is-invalid', !valid);
  }

  setStrictness ({ strictness }) {
    document.getElementById('set-strictness').value = strictness;
    document.getElementById('strictness-display').textContent = strictness;
  }

  setMaxYear ({ maxYear }) {
    setYear(maxYear, 'max-year');
  }

  setMinYear ({ minYear }) {
    setYear(minYear, 'min-year');
  }

  startNextQuestion ({ packetLength, question }) {
    document.getElementById('question').textContent = '';
    document.getElementById('settings').classList.add('d-none');
    document.getElementById('packet-length-info').textContent = this.room.mode === MODE_ENUM.SET_NAME ? packetLength : '-';
    document.getElementById('packet-number-info').textContent = question.packet.number;
    document.getElementById('question-number-info').textContent = question.number;
    document.getElementById('set-name-info').textContent = question.set.name;
  }

  timerUpdate ({ timeRemaining }) {
    const seconds = Math.floor(timeRemaining / 10);
    const tenths = timeRemaining % 10;
    document.querySelector('.timer .face').textContent = seconds;
    document.querySelector('.timer .fraction').textContent = '.' + tenths;
  }

  toggleSkip ({ skip }) {
    document.getElementById('toggle-skip').checked = skip;
    document.getElementById('skip').disabled = !skip || document.getElementById('skip').classList.contains('d-none');
  }

  toggleStandardOnly ({ standardOnly }) {
    document.getElementById('toggle-standard-only').checked = standardOnly;
  }

  toggleTimer ({ timer }) {
    document.getElementById('timer').classList.toggle('d-none', !timer);
    document.getElementById('toggle-timer').checked = timer;
  }
}

const fontSize = window.localStorage.getItem('font-size');
if (fontSize) {
  document.getElementById('question').style.setProperty('font-size', `${fontSize}px`);
}

if (window.localStorage.getItem('high-contrast-question-text') === 'true') {
  document.getElementById('question').classList.add('high-contrast-question-text');
}

function polyfillSetNameInput () {
  // eslint-disable-next-line no-unused-vars
  function fillSetName (event) {
    const setNameInput = document.getElementById('set-name');
    const name = event.target.innerHTML;
    setNameInput.value = name;
    setNameInput.focus();
  }

  function removeDropdown () {
    document.getElementById('set-dropdown')?.remove();
  }

  if (window.navigator.userAgent.match(/Mobile.*Firefox/)) {
    const setNameInput = document.getElementById('set-name');
    setNameInput.addEventListener('input', function () {
      document.getElementById('set-dropdown')?.remove();
      const set = this.value.toLowerCase();
      const dropdownItems = SET_LIST
        .filter(setName => setName.toLowerCase().includes(set))
        .map(setName => `<a class="dropdown-item" onclick="fillSetName(event)">${setName}</a>`)
        .join('');
      const dropdownHtml = dropdownItems === ''
        ? ''
        : `
        <div id="set-dropdown" class="dropdown-menu" style="display: inline" aria-labelledby="set-name">
            ${dropdownItems}
        </div>
        `;
      setNameInput.insertAdjacentHTML('afterend', dropdownHtml);
    });
    setNameInput.addEventListener('blur', removeDropdown);
  }
}
polyfillSetNameInput();

const banners = {};

account.getUsername().then(username => {
  const toast = new bootstrap.Toast(document.getElementById('funny-toast'));
  const toastText = document.getElementById('funny-toast-text');

  if (username in banners) {
    toastText.textContent = banners[username];
    toast.show();
  }
});

function attachEventListeners (room, socket) {
  document.getElementById('answer-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    const answer = document.getElementById('answer-input').value;
    socket.sendToServer({ type: 'give-answer', givenAnswer: answer });
  });

  document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'clear-stats' });
  });

  document.getElementById('next').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'next' });
  });

  document.getElementById('packet-number').addEventListener('change', function () {
    const range = rangeToArray(this.value.trim(), room.setLength);
    if (range.some(num => num < 1 || num > room.setLength)) {
      document.getElementById('packet-number').classList.add('is-invalid');
      return;
    }
    document.getElementById('packet-number').classList.remove('is-invalid');
    socket.sendToServer({ type: 'set-packet-numbers', packetNumbers: range });
  });

  document.getElementById('report-question-submit').addEventListener('click', function () {
    reportQuestion(
      document.getElementById('report-question-id').value,
      document.getElementById('report-question-reason').value,
      document.getElementById('report-question-description').value
    );
  });

  document.getElementById('set-mode').addEventListener('change', function () {
    this.blur();
    socket.sendToServer({ type: 'set-mode', mode: this.value });
  });

  document.getElementById('set-name').addEventListener('change', function () {
    socket.sendToServer({ type: 'set-set-name', setName: this.value.trim() });
  });

  document.getElementById('set-strictness').addEventListener('change', function () {
    this.blur();
    socket.sendToServer({ type: 'set-strictness', strictness: this.value });
  });

  document.getElementById('set-strictness').addEventListener('input', function () {
    document.getElementById('strictness-display').textContent = this.value;
  });

  document.getElementById('start').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'start' });
  });

  document.getElementById('toggle-settings').addEventListener('click', function () {
    this.blur();
    document.getElementById('buttons').classList.toggle('col-lg-9');
    document.getElementById('buttons').classList.toggle('col-lg-12');
    document.getElementById('content').classList.toggle('col-lg-9');
    document.getElementById('content').classList.toggle('col-lg-12');
    document.getElementById('settings').classList.toggle('d-none');
    document.getElementById('settings').classList.toggle('d-lg-none');
  });

  document.getElementById('toggle-show-history').addEventListener('click', function () {
    this.blur();
    document.getElementById('room-history').classList.toggle('d-none', !this.checked);
  });

  document.getElementById('toggle-standard-only').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'toggle-standard-only', standardOnly: this.checked });
  });

  document.getElementById('toggle-timer').addEventListener('click', function () {
    this.blur();
    socket.sendToServer({ type: 'toggle-timer', timer: this.checked });
  });

  addSliderEventListeners((year, which) => {
    socket.sendToServer({ type: `set-${which}`, [which === 'min-year' ? 'minYear' : 'maxYear']: year });
  });
}
