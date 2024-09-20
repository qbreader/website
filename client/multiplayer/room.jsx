/* globals WebSocket */

import account from '../scripts/accounts.js';
import questionStats from '../scripts/auth/question-stats.js';
import api from '../scripts/api/index.js';
import audio from '../audio/index.js';
import CategoryManager from '../scripts/utilities/category-manager.js';
import { getDropdownValues } from '../scripts/utilities/dropdown-checklist.js';
import { arrayToRange, createTossupCard, rangeToArray } from '../scripts/utilities/index.js';
import { escapeHTML } from '../scripts/utilities/strings.js';
import CategoryModal from '../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../scripts/components/DifficultyDropdown.min.js';

const categoryManager = new CategoryManager();
let oldCategories = JSON.stringify(categoryManager.export());

let maxPacketNumber = 24;

/**
 * userId to player object
 */
const players = {};

const ROOM_NAME = decodeURIComponent(window.location.pathname.substring(13));
let tossup = {};
let USER_ID = window.localStorage.getItem('USER_ID') || 'unknown';
let username = window.localStorage.getItem('multiplayer-username') || await api.getRandomName();

const socket = new WebSocket(
  window.location.href.replace('http', 'ws') +
    (window.location.href.endsWith('?private=true') ? '&' : '?') +
    new URLSearchParams({
      roomName: ROOM_NAME,
      userId: USER_ID,
      username
    }).toString()
);

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'error':
      socket.close(3000);
      window.alert(data.error);
      window.location.href = '/multiplayer';
      break;

    case 'buzz':
      socketOnBuzz(data);
      break;

    case 'change-username':
      socketOnChangeUsername(data);
      break;

    case 'force-username':
      window.alert(data.message);
      window.localStorage.setItem('multiplayer-username', data.username);
      document.querySelector('#username').value = data.username;
      break;

    case 'chat':
      logChat(data.username, data.message, false, data.userId);
      break;

    case 'chat-live-update':
      logChat(data.username, data.message, true, data.userId);
      break;

    case 'clear-stats':
      socketOnClearStats(data);
      break;

    case 'connection-acknowledged':
      socketOnConnectionAcknowledged(data);
      break;

    case 'connection-acknowledged-query':
      socketOnConnectionAcknowledgedQuery(data);
      break;

    case 'connection-acknowledged-tossup':
      socketOnConnectionAcknowledgedTossup(data);
      break;

    case 'end-of-set':
      socketOnEndOfSet(data);
      break;

    case 'difficulties':
      if (data.value.length > 0) {
        logEvent(data.username, `changed the difficulties to ${data.value}`);
      } else {
        logEvent(data.username, 'cleared the difficulties');
      }
      updateDifficulties(data.value);
      break;
    case 'packet-number':
      data.value = arrayToRange(data.value);
      // eslint-disable-next-line no-fallthrough
    case 'set-name':
      if (data.value.length > 0) {
        logEvent(data.username, `changed the ${data.type} to ${data.value}`);
      } else {
        logEvent(data.username, `cleared the ${data.type}`);
      }
      document.getElementById(data.type).value = data.value;
      break;

    case 'give-answer':
      socketOnGiveAnswer(data);
      break;

    case 'give-answer-live-update':
      logGiveAnswer(data.username, data.message, true);
      break;

    case 'join':
      socketOnJoin(data);
      break;

    case 'leave':
      socketOnLeave(data);
      break;

    case 'lost-buzzer-race':
      socketOnLostBuzzerRace(data);
      break;

    case 'next':
    case 'skip':
      socketOnNext(data);
      break;

    case 'no-questions-found':
      socketOnNoQuestionsFound(data);
      break;

    case 'pause':
      socketOnPause(data);
      break;

    case 'reading-speed':
      logEvent(data.username, `changed the reading speed to ${data.value}`);
      document.getElementById('reading-speed').value = data.value;
      document.getElementById('reading-speed-display').textContent = data.value;
      break;

    case 'reveal-answer': {
      document.getElementById('question').innerHTML = data.question;
      document.getElementById('answer').innerHTML = 'ANSWER: ' + data.answer;
      document.getElementById('pause').disabled = true;
      showNextButton();
      break;
    }

    case 'start':
      socketOnStart(data);
      break;

    case 'timer-update':
      updateTimerDisplay(data.timeRemaining);
      break;

    case 'toggle-lock':
      logEvent(data.username, `${data.lock ? 'locked' : 'unlocked'} the room`);
      document.getElementById('toggle-lock').checked = data.lock;
      break;

    case 'toggle-powermark-only':
      logEvent(data.username, `${data.powermarkOnly ? 'enabled' : 'disabled'} powermark only`);
      document.getElementById('toggle-powermark-only').checked = data.powermarkOnly;
      break;

    case 'toggle-rebuzz':
      logEvent(data.username, `${data.rebuzz ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
      document.getElementById('toggle-rebuzz').checked = data.rebuzz;
      break;

    case 'toggle-skip':
      logEvent(data.username, `${data.skip ? 'enabled' : 'disabled'} skipping`);
      document.getElementById('toggle-skip').checked = data.skip;
      document.getElementById('skip').disabled = !data.skip || document.getElementById('skip').classList.contains('d-none');
      break;

    case 'toggle-select-by-set-name':
      if (data.selectBySetName) {
        logEvent(data.username, 'enabled select by set name');
        document.getElementById('toggle-select-by-set-name').checked = true;
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        document.getElementById('set-name').textContent = data.setName;
      } else {
        logEvent(data.username, 'enabled select by difficulty');
        document.getElementById('toggle-select-by-set-name').checked = false;
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
      }
      document.getElementById('toggle-powermark-only').disabled = data.selectBySetName;
      document.getElementById('toggle-standard-only').disabled = data.selectBySetName;
      break;

    case 'toggle-standard-only':
      logEvent(data.username, `${data.standardOnly ? 'enabled' : 'disabled'} standard format only`);
      document.getElementById('toggle-standard-only').checked = data.standardOnly;
      break;

    case 'toggle-timer':
      logEvent(data.username, `${data.timer ? 'enabled' : 'disabled'} the timer`);
      document.getElementById('toggle-timer').checked = data.timer;
      document.getElementById('timer').classList.toggle('d-none');
      break;

    case 'toggle-visibility':
      logEvent(data.username, `made the room ${data.public ? 'public' : 'private'}`);
      document.getElementById('toggle-visibility').checked = data.public;
      document.getElementById('chat').disabled = data.public;
      document.getElementById('toggle-lock').disabled = data.public;
      document.getElementById('toggle-timer').disabled = data.public;
      document.getElementById('toggle-timer').checked = true;
      break;

    case 'update-categories':
      logEvent(data.username, 'updated the categories');
      categoryManager.import(data.categories, data.subcategories, data.alternateSubcategories);
      categoryManager.loadCategoryModal();
      break;

    case 'update-question':
      if (data.word !== '(*)') {
        document.getElementById('question').innerHTML += data.word + ' ';
      }
      break;

    case 'year-range':
      $('#slider').slider('values', 0, data.minYear);
      $('#slider').slider('values', 1, data.maxYear);
      document.getElementById('year-range-a').textContent = data.minYear;
      document.getElementById('year-range-b').textContent = data.maxYear;
      break;
  }
};

socket.onclose = function (event) {
  const { code } = event;
  clearInterval(PING_INTERVAL_ID);
  if (code !== 3000) {
    window.alert('Disconnected from server');
  }
};

const socketOnBuzz = (message) => {
  logEvent(message.username, 'buzzed');

  document.getElementById('buzz').disabled = true;
  document.getElementById('pause').disabled = true;
  document.getElementById('next').disabled = true;
  document.getElementById('skip').disabled = true;

  if (message.userId === USER_ID) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
  }
};

const socketOnChangeUsername = (message) => {
  logEvent(message.oldUsername, `changed their username to ${message.newUsername}`);
  document.getElementById('username-' + message.userId).textContent = message.newUsername;
  players[message.userId].username = message.newUsername;
  sortPlayerListGroup();

  if (message.userId === USER_ID) {
    username = message.newUsername;
    window.localStorage.setItem('multiplayer-username', username);
    document.getElementById('username').value = username;
  }
};

const socketOnClearStats = (message) => {
  for (const field of ['celerity', 'negs', 'points', 'powers', 'tens', 'tuh', 'zeroes']) {
    players[message.userId][field] = 0;
  }

  upsertPlayerItem(players[message.userId]);
  sortPlayerListGroup();
};

const socketOnConnectionAcknowledged = async (message) => {
  USER_ID = message.userId;
  window.localStorage.setItem('USER_ID', USER_ID);

  document.getElementById('chat').disabled = message.public;
  document.getElementById('toggle-rebuzz').checked = message.rebuzz;
  document.getElementById('toggle-skip').checked = message.skip;
  document.getElementById('toggle-timer').checked = message.timer;
  document.getElementById('toggle-timer').disabled = message.public;
  if (!message.timer) {
    document.getElementById('timer').classList.add('d-none');
  }
  document.getElementById('toggle-visibility').checked = message.public;
  document.getElementById('reading-speed').value = message.readingSpeed;
  document.getElementById('reading-speed-display').textContent = message.readingSpeed;

  if (message.selectBySetName) {
    document.getElementById('toggle-select-by-set-name').checked = true;
    document.getElementById('difficulty-settings').classList.add('d-none');
    document.getElementById('set-settings').classList.remove('d-none');
  } else {
    document.getElementById('toggle-select-by-set-name').checked = false;
    document.getElementById('difficulty-settings').classList.remove('d-none');
    document.getElementById('set-settings').classList.add('d-none');
  }

  switch (message.questionProgress) {
    case 0:
      document.getElementById('next').textContent = 'Start';
      document.getElementById('next').classList.remove('btn-primary');
      document.getElementById('next').classList.add('btn-success');
      break;
    case 1:
      showSkipButton();
      document.getElementById('options').classList.add('d-none');
      if (message.buzzedIn) {
        document.getElementById('buzz').disabled = true;
        document.getElementById('next').disabled = true;
        document.getElementById('pause').disabled = true;
      } else {
        document.getElementById('buzz').disabled = false;
        document.getElementById('pause').disabled = false;
      }
      break;
    case 2:
      showNextButton();
      document.getElementById('options').classList.add('d-none');
      break;
  }

  if (message.isPermanent) {
    document.getElementById('category-select-button').disabled = true;
    document.getElementById('toggle-visibility').disabled = true;
    document.getElementById('toggle-select-by-set-name').disabled = true;
    document.getElementById('private-chat-warning').innerHTML = 'This is a permanent room. Some settings have been restricted.';
  }

  Object.keys(message.players).forEach(userId => {
    message.players[userId].celerity = message.players[userId].celerity.correct.average;
    players[userId] = message.players[userId];
    upsertPlayerItem(players[userId]);
  });

  if (!message.canBuzz) {
    document.getElementById('buzz').disabled = true;
  }

  sortPlayerListGroup();
};

const socketOnConnectionAcknowledgedTossup = (message) => {
  tossup = message.tossup;
  document.getElementById('set-name-info').textContent = tossup?.set?.name ?? '';
  document.getElementById('packet-number-info').textContent = tossup?.packet?.number ?? '-';
  document.getElementById('question-number-info').textContent = tossup?.number ?? '-';
};

const socketOnConnectionAcknowledgedQuery = async (message) => {
  categoryManager.import(message.validCategories, message.validSubcategories, message.validAlternateSubcategories);
  categoryManager.loadCategoryModal();

  updateDifficulties(message.difficulties || []);
  document.getElementById('set-name').value = message.setName || '';
  document.getElementById('packet-number').value = arrayToRange(message.packetNumbers) || '';

  maxPacketNumber = await api.getNumPackets(document.getElementById('set-name').value);
  if (document.getElementById('set-name').value !== '' && maxPacketNumber === 0) {
    document.getElementById('set-name').classList.add('is-invalid');
  }

  document.getElementById('toggle-powermark-only').disabled = message.selectBySetName;
  document.getElementById('toggle-standard-only').disabled = message.selectBySetName;

  document.getElementById('toggle-powermark-only').checked = message.powermarkOnly;
  document.getElementById('toggle-standard-only').checked = message.standardOnly;

  $('#slider').slider('values', 0, message.minYear);
  $('#slider').slider('values', 1, message.maxYear);
  document.getElementById('year-range-a').textContent = message.minYear;
  document.getElementById('year-range-b').textContent = message.maxYear;
};

const socketOnEndOfSet = () => {
  window.alert('You have reached the end of the set');
};

const socketOnGiveAnswer = async (message) => {
  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input-group').classList.add('d-none');
  document.getElementById('answer-input').blur();

  const { userId, username, givenAnswer, directive, directedPrompt, score, celerity } = message;

  logGiveAnswer(username, givenAnswer, false, directive);

  if (directive === 'prompt' && directedPrompt) {
    logEvent(username, `was prompted with "${directedPrompt}"`);
  } else if (directive === 'prompt') {
    logEvent(username, 'was prompted');
  } else {
    logEvent(username, `${score > 0 ? '' : 'in'}correctly answered for ${score} points`);
  }

  if (directive === 'prompt' && userId === USER_ID) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
  } else if (directive !== 'prompt') {
    document.getElementById('answer-input').placeholder = 'Enter answer';
    document.getElementById('next').disabled = false;
    document.getElementById('pause').disabled = false;

    if (directive === 'accept') {
      document.getElementById('buzz').disabled = true;
      Array.from(document.getElementsByClassName('tuh')).forEach(element => {
        element.textContent = parseInt(element.innerHTML) + 1;
      });
    }

    if (directive === 'reject') {
      document.getElementById('buzz').disabled = !document.getElementById('toggle-rebuzz').checked && userId === USER_ID;
    }

    if (score > 10) {
      players[userId].powers++;
    } else if (score === 10) {
      players[userId].tens++;
    } else if (score < 0) {
      players[userId].negs++;
    }

    players[userId].points += score;
    players[userId].tuh++;
    players[userId].celerity = celerity;

    upsertPlayerItem(players[userId]);
    sortPlayerListGroup();
  }

  if (directive !== 'prompt' && userId === USER_ID && await account.getUsername()) {
    questionStats.recordTossup(message.tossup, score > 0, score, message.perQuestionCelerity, true);
  }

  if (audio.soundEffects && userId === USER_ID) {
    if (directive === 'accept' && score > 10) {
      audio.power.play();
    } else if (directive === 'accept' && score === 10) {
      audio.correct.play();
    } else if (directive === 'reject') {
      audio.incorrect.play();
    }
  }
};

const socketOnJoin = (message) => {
  const { userId, username } = message;
  logEvent(username, 'joined the game');
  if (userId === USER_ID) {
    return;
  }

  if (message.isNew) {
    message.user.celerity = message.user.celerity.correct.average;
    upsertPlayerItem(message.user);
    sortPlayerListGroup();
    players[userId] = message.user;
  } else {
    players[message.userId].online = true;
    document.getElementById('points-' + message.userId).classList.add('bg-success');
    document.getElementById('points-' + message.userId).classList.remove('bg-secondary');
  }
};

const socketOnLeave = (message) => {
  logEvent(message.username, 'left the game');
  players[message.userId].online = false;
  document.getElementById('points-' + message.userId).classList.remove('bg-success');
  document.getElementById('points-' + message.userId).classList.add('bg-secondary');
};

const socketOnLostBuzzerRace = (message) => {
  logEvent(message.username, 'lost the buzzer race');
  if (message.userId === USER_ID) {
    document.getElementById('answer-input-group').classList.add('d-none');
  }
};

const socketOnNext = (message) => {
  if (message.type === 'skip') {
    logEvent(message.username, 'skipped the question');
  } else {
    logEvent(message.username, 'went to the next question');
  }

  tossup.question = document.getElementById('question').innerHTML;
  tossup.answer = document.getElementById('answer').innerHTML.replace('ANSWER: ', '');

  createTossupCard(tossup);

  tossup = message.tossup;

  document.getElementById('set-name-info').textContent = tossup?.set.name ?? '';
  document.getElementById('question-number-info').textContent = tossup?.number ?? '-';
  document.getElementById('packet-number-info').textContent = tossup?.packet.number ?? '-';

  document.getElementById('options').classList.add('d-none');
  showSkipButton();
  document.getElementById('question').textContent = '';
  document.getElementById('answer').textContent = '';
  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('buzz').disabled = false;
  document.getElementById('pause').textContent = 'Pause';
  document.getElementById('pause').disabled = false;

  updateTimerDisplay(100);
};

const socketOnNoQuestionsFound = () => {
  window.alert('No questions found');
};

const socketOnPause = (message) => {
  logEvent(message.username, `${message.paused ? '' : 'un'}paused the game`);
};

const socketOnStart = (message) => {
  logEvent(message.username, 'started the game');

  document.getElementById('question').textContent = '';
  document.getElementById('answer').textContent = '';
  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('buzz').disabled = false;
  document.getElementById('pause').textContent = 'Pause';
  document.getElementById('pause').disabled = false;
  document.getElementById('next').classList.add('btn-primary');
  document.getElementById('next').classList.remove('btn-success');
  document.getElementById('next').textContent = 'Next';
  showSkipButton();

  tossup = message.tossup;

  document.getElementById('set-name-info').textContent = tossup?.set.name ?? '';
  document.getElementById('question-number-info').textContent = tossup?.number ?? '-';
  document.getElementById('packet-number-info').textContent = tossup?.packet.number ?? '-';
};

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(() => {
  socket.send(JSON.stringify({ type: 'ping' }));
}, 45000);

function logChat (username, message, isLive = false, userId = null) {
  if (!isLive && message === '') {
    document.getElementById('live-chat-' + userId).parentElement.remove();
    return;
  }

  if (!isLive && message) {
    document.getElementById('live-chat-' + userId).className = '';
    document.getElementById('live-chat-' + userId).id = '';
    return;
  }

  if (document.getElementById('live-chat-' + userId)) {
    document.getElementById('live-chat-' + userId).textContent = message;
    return;
  }

  const b = document.createElement('b');
  b.textContent = username;

  const span = document.createElement('span');
  span.classList.add('text-muted');
  span.id = 'live-chat-' + userId;
  span.textContent = message;

  const li = document.createElement('li');
  li.appendChild(b);
  li.appendChild(document.createTextNode(' '));
  li.appendChild(span);
  document.getElementById('room-history').prepend(li);
}

function logEvent (username, message) {
  const span1 = document.createElement('span');
  span1.textContent = username;

  const span2 = document.createElement('span');
  span2.textContent = message;

  const i = document.createElement('i');
  i.appendChild(span1);
  i.appendChild(document.createTextNode(' '));
  i.appendChild(span2);

  const li = document.createElement('li');
  li.appendChild(i);

  document.getElementById('room-history').prepend(li);
}

function logGiveAnswer (username, message, isLive = false, directive = null) {
  const badge = document.createElement('span');
  badge.textContent = 'Buzz';
  switch (directive) {
    case 'accept':
      badge.className = 'badge text-dark bg-success';
      break;
    case 'reject':
      badge.className = 'badge text-light bg-danger';
      break;
    case 'prompt':
      badge.className = 'badge text-dark bg-warning';
      break;
    default:
      badge.className = 'badge text-light bg-primary';
      break;
  }

  let secondBadge = null;
  if (directive === 'accept' || directive === 'reject') {
    secondBadge = document.createElement('span');
    secondBadge.className = badge.className;

    if (directive === 'accept') {
      secondBadge.textContent = 'Correct';
    } else if (directive === 'reject') {
      secondBadge.textContent = 'Incorrect';
    }
  }

  const b = document.createElement('b');
  b.textContent = username;

  const span = document.createElement('span');
  span.textContent = message;

  let li;
  if (document.getElementById('live-buzz')) {
    li = document.getElementById('live-buzz');
    li.textContent = '';
  } else {
    li = document.createElement('li');
    li.id = 'live-buzz';
    document.getElementById('room-history').prepend(li);
  }

  li.appendChild(badge);
  li.appendChild(document.createTextNode(' '));
  li.appendChild(b);
  li.appendChild(document.createTextNode(' '));
  li.appendChild(span);

  if (secondBadge) {
    li.appendChild(document.createTextNode(' '));
    li.appendChild(secondBadge);
  }

  if (!isLive) {
    li.id = '';
  }
}

function showNextButton () {
  document.getElementById('next').classList.remove('d-none');
  document.getElementById('next').disabled = false;
  document.getElementById('skip').classList.add('d-none');
  document.getElementById('skip').disabled = true;
}

function showSkipButton () {
  document.getElementById('skip').classList.remove('d-none');
  document.getElementById('skip').disabled = !document.getElementById('toggle-skip').checked;
  document.getElementById('next').classList.add('d-none');
  document.getElementById('next').disabled = true;
}

function sortPlayerListGroup (descending = true) {
  const listGroup = document.getElementById('player-list-group');
  const items = Array.from(listGroup.children);
  const offset = 'list-group-'.length;
  items.sort((a, b) => {
    const aPoints = parseInt(document.getElementById('points-' + a.id.substring(offset)).innerHTML);
    const bPoints = parseInt(document.getElementById('points-' + b.id.substring(offset)).innerHTML);
    // if points are equal, sort alphabetically by username
    if (aPoints === bPoints) {
      const aUsername = document.getElementById('username-' + a.id.substring(offset)).innerHTML;
      const bUsername = document.getElementById('username-' + b.id.substring(offset)).innerHTML;
      return descending ? aUsername.localeCompare(bUsername) : bUsername.localeCompare(aUsername);
    }
    return descending ? bPoints - aPoints : aPoints - bPoints;
  }).forEach(item => {
    listGroup.appendChild(item);
  });
}

function updateDifficulties (difficulties) {
  Array.from(document.getElementById('difficulties').children).forEach(li => {
    const input = li.querySelector('input');

    if (difficulties.includes(parseInt(input.value))) {
      input.checked = true;
      li.classList.add('active');
    } else {
      input.checked = false;
      li.classList.remove('active');
    }
  });
}

function updateTimerDisplay (time) {
  const seconds = Math.floor(time / 10);
  const tenths = time % 10;

  document.querySelector('.timer .face').innerText = seconds;
  document.querySelector('.timer .fraction').innerText = '.' + tenths;
}

function upsertPlayerItem (player) {
  const { userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0, celerity = 0, online } = player;

  if (document.getElementById('list-group-' + userId)) {
    document.getElementById('list-group-' + userId).remove();
  }

  const playerItem = document.createElement('a');
  playerItem.className = `list-group-item ${userId === USER_ID ? 'user-score' : ''} clickable`;
  playerItem.id = `list-group-${userId}`;
  playerItem.innerHTML = `
    <div class="d-flex justify-content-between">
        <span id="username-${userId}">${escapeHTML(username)}</span>
        <span><span id="points-${userId}" class="badge rounded-pill ${online ? 'bg-success' : 'bg-secondary'}">${points}</span></span>
    </div>
    `;

  playerItem.setAttribute('data-bs-container', 'body');
  playerItem.setAttribute('data-bs-custom-class', 'w-25');
  playerItem.setAttribute('data-bs-html', 'true');
  playerItem.setAttribute('data-bs-placement', 'left');
  playerItem.setAttribute('data-bs-toggle', 'popover');
  playerItem.setAttribute('data-bs-trigger', 'focus');
  playerItem.setAttribute('tabindex', '0');

  playerItem.setAttribute('data-bs-title', username);
  playerItem.setAttribute('data-bs-content', `
    <ul class="list-group list-group-flush">
        <li class="list-group-item">
            <span>Powers</span>
            <span id="powers-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${powers}</span>
        </li>
        <li class="list-group-item">
            <span>Tens</span>
            <span id="tens-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${tens}</span>
        </li>
        <li class="list-group-item">
            <span>Negs</span>
            <span id="negs-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${negs}</span>
        </li>
        <li class="list-group-item">
            <span>TUH</span>
            <span id="tuh-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${tuh}</span>
        </li>
        <li class="list-group-item">
            <span>Celerity</span>
            <span id="celerity-${userId}" class="float-end stats stats-${userId}">${celerity.toFixed(3)}</span>
        </li>
    </ul>
    `);

  document.getElementById('player-list-group').appendChild(playerItem);
  // bootstrap requires "new" to be called on each popover
  // eslint-disable-next-line no-new
  new bootstrap.Popover(playerItem);
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const answer = document.getElementById('answer-input').value;

  socket.send(JSON.stringify({
    type: 'give-answer',
    givenAnswer: answer
  }));
});

document.getElementById('answer-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: 'give-answer-live-update', message: this.value }));
});

document.getElementById('buzz').addEventListener('click', function () {
  this.blur();
  if (audio.soundEffects) audio.buzz.play();
  socket.send(JSON.stringify({ type: 'buzz' }));
  socket.send(JSON.stringify({ type: 'give-answer-live-update', message: '' }));
});

document.getElementById('chat').addEventListener('click', function () {
  this.blur();
  document.getElementById('chat-input-group').classList.remove('d-none');
  document.getElementById('chat-input').focus();
  socket.send(JSON.stringify({ type: 'chat-live-update', message: '' }));
});

document.getElementById('chat-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const message = document.getElementById('chat-input').value;
  document.getElementById('chat-input').value = '';
  document.getElementById('chat-input-group').classList.add('d-none');
  document.getElementById('chat-input').blur();

  socket.send(JSON.stringify({ type: 'chat', message }));
});

document.getElementById('chat-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: 'chat-live-update', message: this.value }));
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'clear-stats' }));
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  switch (this.innerHTML) {
    case 'Start':
      socket.send(JSON.stringify({ type: 'start' }));
      break;
    case 'Next':
      socket.send(JSON.stringify({ type: 'next' }));
      break;
  }
});

document.getElementById('skip').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'skip' }));
});

document.getElementById('packet-number').addEventListener('change', function () {
  const range = rangeToArray(this.value, maxPacketNumber);
  if (range.some((num) => num < 1 || num > maxPacketNumber)) { return document.getElementById('packet-number').classList.add('is-invalid'); } else document.getElementById('packet-number').classList.remove('is-invalid');
  socket.send(JSON.stringify({ type: 'packet-number', value: range }));
});

document.getElementById('pause').addEventListener('click', function () {
  this.blur();
  const seconds = parseFloat(document.querySelector('.timer .face').innerText);
  const tenths = parseFloat(document.querySelector('.timer .fraction').innerText);
  const pausedTime = (seconds + tenths) * 10;
  socket.send(JSON.stringify({ type: 'pause', pausedTime }));
});

document.getElementById('reading-speed').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'reading-speed', value: this.value }));
});

document.getElementById('reading-speed').addEventListener('input', function () {
  document.getElementById('reading-speed-display').textContent = this.value;
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  api.reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

document.getElementById('set-name').addEventListener('change', async function () {
  if (api.getSetList().includes(this.value) || this.value.length === 0) {
    this.classList.remove('is-invalid');
  } else {
    this.classList.add('is-invalid');
  }
  maxPacketNumber = await api.getNumPackets(this.value);
  if (this.value === '' || maxPacketNumber === 0) {
    document.getElementById('packet-number').value = '';
  } else {
    document.getElementById('packet-number').value = `1-${maxPacketNumber}`;
  }

  socket.send(JSON.stringify({ type: 'set-name', value: this.value, packetNumbers: rangeToArray(document.getElementById('packet-number').value) }));
});

document.getElementById('toggle-lock').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-lock', lock: this.checked }));
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-powermark-only', powermarkOnly: this.checked }));
});

document.getElementById('toggle-rebuzz').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-rebuzz', rebuzz: this.checked }));
});

document.getElementById('toggle-skip').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-skip', skip: this.checked }));
});

document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({
    type: 'toggle-select-by-set-name',
    setName: document.getElementById('set-name').value,
    selectBySetName: this.checked
  }));
});

document.getElementById('toggle-standard-only').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-standard-only', standardOnly: this.checked }));
});

document.getElementById('toggle-timer').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-timer', timer: this.checked }));
});

document.getElementById('toggle-visibility').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-visibility', public: this.checked }));
});

document.getElementById('username').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'change-username', userId: USER_ID, oldUsername: username, username: this.value }));
  username = this.value;
  window.localStorage.setItem('multiplayer-username', username);
});

document.getElementById('year-range-a').onchange = function () {
  const [minYear, maxYear] = $('#slider').slider('values');
  if (maxYear < minYear) {
    document.querySelector('#yearRangeAlert').style.display = '';
    return;
  } else {
    document.querySelector('#yearRangeAlert').style.display = 'none';
  }
  socket.send(JSON.stringify({ type: 'year-range', minYear, maxYear }));
};

document.addEventListener('keydown', function (event) {
  // press escape to close chat
  if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');
    document.getElementById('chat-input').blur();
    socket.send(JSON.stringify({ type: 'chat', message: '' }));
  }

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key) {
    case ' ':
      // Prevent spacebar from scrolling the page
      document.getElementById('buzz').click();
      if (event.target === document.body) event.preventDefault();
      break;

    case 'k':
      document.getElementsByClassName('card-header-clickable')[0].click();
      break;

    case 't':
      document.getElementsByClassName('star-tossup')[0].click();
      break;

    case 'y':
      navigator.clipboard.writeText(tossup._id ?? '');
      break;

    case 'n':
    case 's':
      document.getElementById('next').click();
      document.getElementById('skip').click();
      break;

    case 'p':
      document.getElementById('pause').click();
      break;
  }
});

document.addEventListener('keypress', function (event) {
  // needs to be keypress
  // keydown immediately hides the input group
  // keyup shows the input group again after submission
  if (event.key === 'Enter' && event.target === document.body) {
    document.getElementById('chat').click();
  }
});

document.getElementById('username').value = username;

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={categoryManager}
    disablePercentView
    onClose={() => {
      if (oldCategories !== JSON.stringify(categoryManager.export())) {
        socket.send(JSON.stringify({ type: 'update-categories', ...categoryManager.export() }));
      }
      oldCategories = JSON.stringify(categoryManager.export());
    }}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    onChange={() => {
      socket.send(JSON.stringify({
        type: 'difficulties',
        value: getDropdownValues('difficulties')
      }));
    }}
  />
);
