import { DEFAULT_MAX_YEAR, DEFAULT_MIN_YEAR, MIN_YEAR, MODE_ENUM } from '../../quizbowl/constants.js';
import account from '../scripts/accounts.js';
import audio from '../audio/index.js';
import { arrayToRange } from '../scripts/utilities/ranges.js';
import { setDropdownValues } from '../scripts/utilities/dropdown-checklist.js';

export default class QuestionClient {
  constructor (room, USER_ID) {
    this.room = room;
    this.USER_ID = USER_ID;
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'alert': return window.alert(data.message);
      case 'end': return this.next(data);
      case 'end-of-set': return this.endOfSet(data);
      case 'give-answer': return this.giveAnswer(data);
      case 'next': return this.next(data);
      case 'no-questions-found': return this.noQuestionsFound(data);
      case 'set-categories': return this.setCategories(data);
      case 'set-difficulties': return this.setDifficulties(data);
      case 'set-mode': return this.setMode(data);
      case 'set-packet-numbers': return this.setPacketNumbers(data);
      case 'set-set-names': return this.setSetNames(data);
      case 'set-strictness': return this.setStrictness(data);
      case 'set-year-range': return this.setYearRange(data);
      case 'skip': return this.next(data);
      case 'start': return this.next(data);
      case 'timer-update': return this.timerUpdate(data);
      case 'toggle-standard-only': return this.toggleStandardOnly(data);
      case 'toggle-timer': return this.toggleTimer(data);
    }
  }

  endOfSet () {
    window.alert('You have reached the end of the set');
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
      if (directive === 'accept' && score && score > 10) {
        audio.power.play();
      } else if (directive === 'accept') {
        audio.correct.play();
      } else if (directive === 'reject') {
        audio.incorrect.play();
      }
    }
  }

  next ({ type, nextQuestion, packetLength }) {
    document.getElementById('question').textContent = '';
    document.getElementById('settings').classList.add('d-none');

    if (type !== 'end') {
      document.getElementById('packet-length-info').textContent = this.room.mode === MODE_ENUM.SET_NAME ? packetLength : '-';
      document.getElementById('packet-number-info').textContent = nextQuestion.packet.number;
      document.getElementById('set-name-info').textContent = nextQuestion.set.name;
      document.getElementById('question-number-info').textContent = nextQuestion.number;
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

  setSetNames ({ setNames, maxPacketNumber }) {
    setDropdownValues('set-names', setNames, true);
    document.getElementById('packet-number').placeholder = 'Packet Numbers' + (maxPacketNumber ? ` (1-${maxPacketNumber})` : '');
    document.getElementById('set-names-label').textContent = setNames.length === 0 ? 'Select Sets' : `${setNames.length} Set${setNames.length !== 1 ? 's' : ''} Selected`;
  }

  setStrictness ({ strictness }) {
    document.getElementById('set-strictness').value = strictness;
    document.getElementById('strictness-display').textContent = strictness;
  }

  setYearRange ({ minYear, maxYear }) {
    $('#slider').slider('values', [minYear, maxYear]);
    document.getElementById('year-range-a').textContent = minYear;
    document.getElementById('year-range-b').textContent = maxYear;
  }

  timerUpdate ({ timeRemaining }) {
    const seconds = Math.floor(timeRemaining / 10);
    const tenths = timeRemaining % 10;
    document.querySelector('.timer .face').textContent = seconds;
    document.querySelector('.timer .fraction').textContent = '.' + tenths;
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

const banners = {};

account.getUsername().then(username => {
  const toast = new bootstrap.Toast(document.getElementById('funny-toast'));
  const toastText = document.getElementById('funny-toast-text');

  if (username in banners) {
    toastText.textContent = banners[username];
    toast.show();
  }
});

document.querySelectorAll('span.default-min-year').forEach(element => {
  element.textContent = DEFAULT_MIN_YEAR;
});

document.querySelectorAll('span.default-max-year').forEach(element => {
  element.textContent = DEFAULT_MAX_YEAR;
});

const slidersToUpdate = [];

document.body.onmouseup = function () {
  for (let i = 0; i < slidersToUpdate.length; ++i) {
    if (slidersToUpdate[i].onchange) {
      slidersToUpdate[i].onchange();
    }
  }
  slidersToUpdate.length = 0;
};

$('#slider').slider({
  min: MIN_YEAR,
  max: DEFAULT_MAX_YEAR,
  step: 1,
  values: [DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR],
  slide: function (event, ui) {
    for (let i = 0; i < ui.values.length; ++i) {
      $(`span.sliderValue${i}`)[0].textContent = ui.values[i];
      if (!slidersToUpdate.includes($(`span.sliderValue${i}`)[0])) {
        slidersToUpdate.push($(`span.sliderValue${i}`)[0]);
      }
    }
  }
});

document.getElementById('slider').classList.remove('ui-widget-content');
document.getElementById('slider').classList.remove('ui-widget');

$('input.sliderValue').change(function () {
  const $this = $(this);
  $('#slider').slider('values', $this.data('index'), $this.val());
});
