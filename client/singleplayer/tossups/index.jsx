import account from '../../scripts/accounts.js';
import api from '../../scripts/api/index.js';
import questionStats from '../../scripts/auth/question-stats.js';
import audio from '../../audio/index.js';
// import Player from '../../../quizbowl/Player.js';
import Player from '../../Player.js';
import ClientTossupRoom from '../ClientTossupRoom.js';
import CategoryManager from '../../scripts/utilities/category-manager.js';
import { createTossupCard, rangeToArray } from '../../scripts/utilities/index.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.min.js';

let maxPacketNumber = 24;

const categoryManager = new CategoryManager();

const USER_ID = 'user';

const room = new ClientTossupRoom();
room.players[USER_ID] = new Player(USER_ID);

const socket = {
  send: onmessage,
  sendToServer: (message) => room.message(USER_ID, message)
};
room.sockets[USER_ID] = socket;

function onmessage (message) {
  const data = JSON.parse(message);
  console.log(data);
  switch (data.type) {
    case 'buzz': return buzz(data);
    case 'clear-stats': return clearStats(data);
    case 'end-of-set': return endOfSet(data);
    case 'give-answer': return giveAnswer(data);
    case 'next': return next(data);
    case 'no-questions-found': return noQuestionsFound(data);
    case 'pause': return pause(data);
    case 'reveal-answer': return revealAnswer(data);
    case 'set-categories': return setCategories(data);
    case 'set-difficulties': return setDifficulties(data);
    case 'set-reading-speed': return setReadingSpeed(data);
    case 'set-packet-numbers': return setPacketNumbers(data);
    case 'set-set-name': return setSetName(data);
    case 'set-year-range': return setYearRange(data);
    case 'skip': return next(data);
    case 'start': return next(data);
    case 'timer-update': return updateTimerDisplay(data.timeRemaining);
    case 'toggle-correct': return toggleCorrect(data);
    case 'toggle-powermark-only': return togglePowermarkOnly(data);
    case 'toggle-rebuzz': return toggleRebuzz(data);
    case 'toggle-select-by-set-name': return toggleSelectBySetName(data);
    case 'toggle-standard-only': return toggleStandardOnly(data);
    case 'toggle-timer': return toggleTimer(data);
    case 'update-question': return updateQuestion(data);
  }
}

function buzz ({ timer, userId, username }) {
  if (audio.soundEffects) { audio.buzz.play(); }

  const typeToAnswer = document.getElementById('type-to-answer').checked;
  if (typeToAnswer) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('buzz').disabled = true;
  }
}

function clearStats ({ userId }) {
  if (userId !== USER_ID) { return; }
  updateStatDisplay(room.players[USER_ID]);
}

function endOfSet () {
  window.alert('No more questions left');
  document.getElementById('buzz').disabled = true;
  document.getElementById('pause').disabled = true;
  document.getElementById('next').disabled = true;
}

async function giveAnswer ({ directive, directedPrompt, perQuestionCelerity, score, tossup, userId }) {
  if (directive === 'prompt') {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    return;
  }

  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').blur();
  document.getElementById('answer-input').placeholder = 'Enter answer';
  document.getElementById('answer-input-group').classList.add('d-none');
  document.getElementById('next').disabled = false;
  document.getElementById('pause').disabled = false;
  if (room.settings.rebuzz) {
    document.getElementById('buzz').disabled = false;
    document.getElementById('buzz').textContent = 'Buzz';
  }

  updateStatDisplay(room.players[USER_ID]);

  if (audio.soundEffects && userId === USER_ID) {
    if (directive === 'accept' && score > 10) {
      audio.power.play();
    } else if (directive === 'accept' && score === 10) {
      audio.correct.play();
    } else if (directive === 'reject') {
      audio.incorrect.play();
    }
  }

  // if (directive !== 'prompt' && userId === USER_ID && await account.getUsername()) {
  //   questionStats.recordTossup(tossup, score > 0, score, perQuestionCelerity, true);
  // }
}

async function next ({ oldTossup, tossup: nextTossup, type }) {
  if (type === 'start') {
    document.getElementById('next').disabled = false;
    document.getElementById('next').textContent = 'Skip';
    document.getElementById('settings').classList.add('d-none');
  }

  if (type === 'next' || type === 'skip') {
    createTossupCard(oldTossup);
  }

  document.getElementById('answer').textContent = '';
  document.getElementById('question').textContent = '';
  document.getElementById('toggle-correct').textContent = 'I was wrong';
  document.getElementById('toggle-correct').classList.add('d-none');

  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('buzz').disabled = false;
  document.getElementById('next').textContent = 'Skip';
  document.getElementById('packet-number-info').textContent = nextTossup.packet.number;
  console.log(room);
  document.getElementById('packet-length-info').textContent = room.query.selectBySetName ? room.tossup.length : '-';
  document.getElementById('pause').textContent = 'Pause';
  document.getElementById('pause').disabled = false;
  document.getElementById('set-name-info').textContent = nextTossup.set.name;

  if (type === 'next' && await account.getUsername() && document.getElementById('answer').innerHTML) {
    const pointValue = room.previous.isCorrect ? (room.previous.inPower ? room.previous.powerValue : 10) : (room.previous.endOfQuestion ? 0 : room.previous.negValue);
    questionStats.recordTossup(room.previous.tossup, room.previous.isCorrect, pointValue, room.previous.celerity, false);
  }
}

function noQuestionsFound () {
  window.alert('No questions found');
}

function pause ({ paused }) {
  document.getElementById('buzz').disabled = paused;
  document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
}

function revealAnswer ({ answer, question }) {
  document.getElementById('question').innerHTML = question;
  document.getElementById('answer').innerHTML = 'ANSWER: ' + answer;
  document.getElementById('pause').disabled = true;

  document.getElementById('buzz').disabled = true;
  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('next').disabled = false;
  document.getElementById('next').textContent = 'Next';
  document.getElementById('start').disabled = false;

  document.getElementById('toggle-correct').classList.remove('d-none');
  document.getElementById('toggle-correct').textContent = room.previous.isCorrect ? 'I was wrong' : 'I was right';
}

function setCategories ({ alternateSubcategories, categories, subcategories }) {
  categoryManager.import(categories, subcategories, alternateSubcategories);
  categoryManager.loadCategoryModal();
}

function setDifficulties ({ value }) {}

function setPacketNumbers ({ value }) {}

function setReadingSpeed ({ value }) {
  document.getElementById('reading-speed').value = value;
  document.getElementById('reading-speed-display').textContent = value;
}

function setSetName ({ value }) {}

function setYearRange ({ minYear, maxYear }) {}

function toggleCorrect ({ correct, userId }) {
  updateStatDisplay(room.players[USER_ID]);
  document.getElementById('toggle-correct').textContent = correct ? 'I was wrong' : 'I was right';
}

function togglePowermarkOnly ({ powermarkOnly }) {}

function toggleRebuzz ({ rebuzz }) {}

function toggleSelectBySetName ({ selectBySetName, setName }) {
  document.getElementById('difficulty-settings').classList.toggle('d-none', selectBySetName);
  document.getElementById('set-settings').classList.toggle('d-none', !selectBySetName);
  document.getElementById('toggle-powermark-only').disabled = selectBySetName;
  document.getElementById('toggle-standard-only').disabled = selectBySetName;
}

function toggleStandardOnly ({ standardOnly }) {}

function toggleTimer ({ timer }) {
  document.getElementById('timer').classList.toggle('d-none', !timer);
}

function updateQuestion ({ word }) {
  if (word === '(*)') { return; }
  document.getElementById('question').innerHTML += word + ' ';
}

/**
 * Updates the displayed stat line.
 */
function updateStatDisplay ({ powers, tens, negs, tuh, points, celerity }) {
  const averageCelerity = celerity.correct.average.toFixed(3);
  const plural = (tuh === 1) ? '' : 's';
  document.getElementById('statline').innerHTML = `${powers}/${tens}/${negs} with ${tuh} tossup${plural} seen (${points} pts, celerity: ${averageCelerity})`;

  // disable clear stats button if no stats
  document.getElementById('clear-stats').disabled = (tuh === 0);
}

function updateTimerDisplay (time) {
  const seconds = Math.floor(time / 10);
  const tenths = time % 10;
  document.querySelector('.timer .face').innerText = seconds;
  document.querySelector('.timer .fraction').innerText = '.' + tenths;
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();
  const answer = document.getElementById('answer-input').value;
  socket.sendToServer({ type: 'give-answer', givenAnswer: answer });
});

document.getElementById('buzz').addEventListener('click', function () {
  this.blur();
  if (audio.soundEffects) audio.buzz.play();
  socket.sendToServer({ type: 'buzz' });
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'clear-stats' });
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  if (this.innerHTML === 'Skip') {
    socket.sendToServer({ type: 'skip' });
  } else {
    socket.sendToServer({ type: 'next' });
  }
});

document.getElementById('packet-number').addEventListener('change', function () {
  const range = rangeToArray(this.value.trim(), maxPacketNumber);

  if (range.some((num) => num < 1 || num > maxPacketNumber)) {
    document.getElementById('packet-number').classList.add('is-invalid');
    return;
  }

  document.getElementById('packet-number').classList.remove('is-invalid');
  socket.sendToServer({ type: 'set-packet-numbers', value: range });
});

document.getElementById('pause').addEventListener('click', function () {
  this.blur();
  const seconds = parseFloat(document.querySelector('.timer .face').innerText);
  const tenths = parseFloat(document.querySelector('.timer .fraction').innerText);
  const pausedTime = (seconds + tenths) * 10;
  socket.sendToServer({ type: 'pause', pausedTime });
});

document.getElementById('reading-speed').addEventListener('change', function () {
  socket.sendToServer({ type: 'set-reading-speed', value: this.value });
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  api.reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

document.getElementById('set-name').addEventListener('change', async function () {
  // make border red if set name is not in set list
  const valid = api.getSetList().includes(this.value) || this.value.length === 0;
  this.classList.toggle('is-invalid', !valid);

  maxPacketNumber = await api.getNumPackets(this.value);

  if (this.value === '' || maxPacketNumber === 0) {
    document.getElementById('packet-number').placeholder = 'Packet Numbers';
  } else {
    document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
  }

  socket.sendToServer({
    type: 'set-set-name',
    value: this.value.trim(),
    packetNumbers: rangeToArray(document.getElementById('packet-number').value)
  });
});

document.getElementById('start').addEventListener('click', function () {
  socket.sendToServer({ type: 'start' });
});

document.getElementById('toggle-correct').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-correct', correct: this.textContent === 'I was right' });
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-powermark-only', powermarkOnly: this.checked });
});

document.getElementById('toggle-rebuzz').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-rebuzz', rebuzz: this.checked });
});

document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({
    type: 'toggle-select-by-set-name',
    setName: document.getElementById('set-name').value,
    selectBySetName: this.checked
  });
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

document.getElementById('year-range-a').onchange = function () {
  const minYear = $('#slider').slider('values', 0);
  const maxYear = $('#slider').slider('values', 1);
  socket.sendToServer({ type: 'set-year-range', minYear, maxYear });
};

document.getElementById('year-range-b').onchange = function () {
  const minYear = $('#slider').slider('values', 0);
  const maxYear = $('#slider').slider('values', 1);
  socket.sendToServer({ type: 'set-year-range', minYear, maxYear });
};

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key) {
    case ' ':
      document.getElementById('buzz').click();
      // Prevent spacebar from scrolling the page:
      if (event.target === document.body) event.preventDefault();
      break;
    case 'e':
      document.getElementById('toggle-settings').click();
      break;
    case 'k':
      document.getElementsByClassName('card-header-clickable')[0].click();
      break;
    case 't':
      document.getElementsByClassName('star-tossup')[0].click();
      break;
    case 'y':
      navigator.clipboard.writeText(room.tossup._id ?? '');
      break;
    case 'n':
      document.getElementById('next').click();
      break;
    case 'p':
      document.getElementById('pause').click();
      break;
    case 's':
      document.getElementById('start').click();
      break;
  }
});

// $(document).ready(function () {
//   $('#slider').slider('values', 0, query.minYear);
//   $('#slider').slider('values', 1, query.maxYear);
// });
// document.getElementById('year-range-a').textContent = query.minYear;
// document.getElementById('year-range-b').textContent = query.maxYear;

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={categoryManager}
    onClose={() => socket.sendToServer({ type: 'set-categories', ...categoryManager.export() })}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    onChange={() => socket.sendToServer({ type: 'set-difficulties', value: getDropdownValues('difficulties') })}
  />
);
