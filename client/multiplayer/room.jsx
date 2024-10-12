/* globals WebSocket */

import account from '../scripts/accounts.js';
import questionStats from '../scripts/auth/question-stats.js';
import api from '../scripts/api/index.js';
import audio from '../audio/index.js';
import CategoryManager from '../../quizbowl/category-manager.js';
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
let username = window.localStorage.getItem('multiplayer-username') || api.getRandomName();

const socket = new WebSocket(
  window.location.href.replace('http', 'ws') +
    (window.location.href.endsWith('?private=true') ? '&' : '?') +
    new URLSearchParams({
      roomName: ROOM_NAME,
      userId: USER_ID,
      username
    }).toString()
);

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(
  () => socket.send(JSON.stringify({ type: 'ping' })),
  45000
);

socket.onclose = function (event) {
  const { code } = event;
  if (code !== 3000) { window.alert('Disconnected from server'); }
  clearInterval(PING_INTERVAL_ID);
};

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'buzz': return buzz(data);
    case 'force-username': return forceUsername(data);
    case 'chat': return chat(data, false);
    case 'chat-live-update': return chat(data, true);
    case 'clear-stats': return clearStats(data);
    case 'connection-acknowledged': return connectionAcknowledged(data);
    case 'connection-acknowledged-query': return connectionAcknowledgedQuery(data);
    case 'connection-acknowledged-tossup': return connectionAcknowledgedTossup(data);
    case 'end-of-set': return endOfSet(data);
    case 'error': return handleError(data);
    case 'give-answer': return giveAnswer(data);
    case 'give-answer-live-update': return logGiveAnswer(data, true);
    case 'join': return join(data);
    case 'leave': return leave(data);
    case 'lost-buzzer-race': return lostBuzzerRace(data);
    case 'next': return next(data);
    case 'no-questions-found': return noQuestionsFound(data);
    case 'pause': return pause(data);
    case 'reveal-answer': return revealAnswer(data);
    case 'set-categories': return setCategories(data);
    case 'set-difficulties': return setDifficulties(data);
    case 'set-reading-speed': return setReadingSpeed(data);
    case 'set-packet-numbers': return setPacketNumbers(data);
    case 'set-set-name': return setSetName(data);
    case 'set-username': return setUsername(data);
    case 'set-year-range': return setYearRange(data);
    case 'skip': return next(data);
    case 'start': return next(data);
    case 'timer-update': return updateTimerDisplay(data.timeRemaining);
    case 'toggle-lock': return toggleLock(data);
    case 'toggle-login-required': return toggleLoginRequired(data);
    case 'toggle-powermark-only': return togglePowermarkOnly(data);
    case 'toggle-public': return togglePublic(data);
    case 'toggle-rebuzz': return toggleRebuzz(data);
    case 'toggle-select-by-set-name': return toggleSelectBySetName(data);
    case 'toggle-skip': return toggleSkip(data);
    case 'toggle-standard-only': return toggleStandardOnly(data);
    case 'toggle-timer': return toggleTimer(data);
    case 'update-question': return updateQuestion(data);
  }
};

function buzz ({ userId, username }) {
  logEvent(username, 'buzzed');
  document.getElementById('buzz').disabled = true;
  document.getElementById('pause').disabled = true;
  document.getElementById('next').disabled = true;
  document.getElementById('skip').disabled = true;

  if (userId === USER_ID) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
  }
}

function chat ({ message, userId, username }, live = false) {
  if (!live && message === '') {
    document.getElementById('live-chat-' + userId).parentElement.remove();
    return;
  }

  if (!live && message) {
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

function clearStats ({ userId }) {
  for (const field of ['celerity', 'negs', 'points', 'powers', 'tens', 'tuh', 'zeroes']) {
    players[userId][field] = 0;
  }
  upsertPlayerItem(players[userId]);
  sortPlayerListGroup();
}

function connectionAcknowledged ({
  buzzedIn,
  canBuzz,
  isPermanent,
  players: messagePlayers,
  questionProgress,
  settings,
  userId
}) {
  document.getElementById('buzz').disabled = !canBuzz;

  if (isPermanent) {
    document.getElementById('category-select-button').disabled = true;
    document.getElementById('toggle-public').disabled = true;
    document.getElementById('toggle-select-by-set-name').disabled = true;
    document.getElementById('private-chat-warning').innerHTML = 'This is a permanent room. Some settings have been restricted.';
  }

  Object.keys(messagePlayers).forEach(userId => {
    messagePlayers[userId].celerity = messagePlayers[userId].celerity.correct.average;
    players[userId] = messagePlayers[userId];
    upsertPlayerItem(players[userId]);
  });
  sortPlayerListGroup();

  switch (questionProgress) {
    case 0:
      document.getElementById('next').textContent = 'Start';
      document.getElementById('next').classList.remove('btn-primary');
      document.getElementById('next').classList.add('btn-success');
      break;
    case 1:
      showSkipButton();
      document.getElementById('settings').classList.add('d-none');
      if (buzzedIn) {
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
      document.getElementById('settings').classList.add('d-none');
      break;
  }

  document.getElementById('toggle-lock').checked = settings.lock;

  document.getElementById('toggle-login-required').checked = settings.loginRequired;

  document.getElementById('chat').disabled = settings.public;
  document.getElementById('toggle-lock').disabled = settings.public;
  document.getElementById('toggle-login-required').disabled = settings.public;
  document.getElementById('toggle-timer').disabled = settings.public;
  document.getElementById('toggle-public').checked = settings.public;

  document.getElementById('reading-speed').value = settings.readingSpeed;
  document.getElementById('reading-speed-display').textContent = settings.readingSpeed;

  document.getElementById('toggle-rebuzz').checked = settings.rebuzz;

  document.getElementById('toggle-skip').checked = settings.skip;

  document.getElementById('timer').classList.toggle('d-none', !settings.timer);
  document.getElementById('toggle-timer').checked = settings.timer;

  USER_ID = userId;
  window.localStorage.setItem('USER_ID', USER_ID);
}

async function connectionAcknowledgedQuery ({
  difficulties = [],
  minYear,
  maxYear,
  packetNumbers = [],
  powermarkOnly,
  selectBySetName,
  setName = '',
  standardOnly,
  validAlternateSubcategories,
  validCategories,
  validSubcategories
}) {
  setDifficulties({ difficulties });

  $('#slider').slider('values', 0, minYear);
  $('#slider').slider('values', 1, maxYear);
  document.getElementById('year-range-a').textContent = minYear;
  document.getElementById('year-range-b').textContent = maxYear;

  document.getElementById('packet-number').value = arrayToRange(packetNumbers);

  document.getElementById('toggle-powermark-only').checked = powermarkOnly;

  document.getElementById('difficulty-settings').classList.toggle('d-none', selectBySetName);
  document.getElementById('set-settings').classList.toggle('d-none', !selectBySetName);
  document.getElementById('toggle-select-by-set-name').checked = selectBySetName;
  document.getElementById('toggle-powermark-only').disabled = selectBySetName;
  document.getElementById('toggle-standard-only').disabled = selectBySetName;

  document.getElementById('set-name').value = setName;
  maxPacketNumber = await api.getNumPackets(setName);
  if (setName !== '' && maxPacketNumber === 0) {
    document.getElementById('set-name').classList.add('is-invalid');
  }

  document.getElementById('toggle-standard-only').checked = standardOnly;

  categoryManager.import(validCategories, validSubcategories, validAlternateSubcategories);
  categoryManager.loadCategoryModal();
}

function connectionAcknowledgedTossup ({ tossup: currentTossup }) {
  tossup = currentTossup;
  document.getElementById('set-name-info').textContent = tossup?.set?.name ?? '';
  document.getElementById('packet-number-info').textContent = tossup?.packet?.number ?? '-';
  document.getElementById('question-number-info').textContent = tossup?.number ?? '-';
}

function endOfSet () {
  window.alert('You have reached the end of the set');
}

function forceUsername ({ message, username }) {
  window.alert(message);
  window.localStorage.setItem('multiplayer-username', username);
  document.querySelector('#username').value = username;
}

async function giveAnswer ({ celerity, directive, directedPrompt, givenAnswer, perQuestionCelerity, score, tossup, userId, username }) {
  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input-group').classList.add('d-none');
  document.getElementById('answer-input').blur();
  logGiveAnswer({ directive, message: givenAnswer, username });

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
    questionStats.recordTossup(tossup, score > 0, score, perQuestionCelerity, true);
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
}

function handleError ({ message }) {
  socket.close(3000);
  window.alert(message);
  window.location.href = '/multiplayer';
}

function join ({ isNew, user, userId, username }) {
  logEvent(username, 'joined the game');
  if (userId === USER_ID) { return; }

  if (isNew) {
    user.celerity = user.celerity.correct.average;
    upsertPlayerItem(user);
    sortPlayerListGroup();
    players[userId] = user;
  } else {
    players[userId].online = true;
    document.getElementById('points-' + userId).classList.add('bg-success');
    document.getElementById('points-' + userId).classList.remove('bg-secondary');
  }
}

function leave ({ userId, username }) {
  logEvent(username, 'left the game');
  players[userId].online = false;
  document.getElementById('points-' + userId).classList.remove('bg-success');
  document.getElementById('points-' + userId).classList.add('bg-secondary');
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

function logGiveAnswer ({ directive = null, message, username }) {
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

  if (directive === 'accept' || directive === 'reject') {
    const secondBadge = document.createElement('span');
    secondBadge.className = badge.className;

    if (directive === 'accept') {
      secondBadge.textContent = 'Correct';
    } else if (directive === 'reject') {
      secondBadge.textContent = 'Incorrect';
    }

    li.appendChild(document.createTextNode(' '));
    li.appendChild(secondBadge);
  }

  if (directive) { li.id = ''; }
}

function lostBuzzerRace ({ username, userId }) {
  logEvent(username, 'lost the buzzer race');
  if (userId === USER_ID) { document.getElementById('answer-input-group').classList.add('d-none'); }
}

function next ({ oldTossup, tossup: nextTossup, type, username }) {
  switch (type) {
    case 'next':
      logEvent(username, 'went to the next question');
      break;
    case 'skip':
      logEvent(username, 'skipped the question');
      break;
    case 'start':
      logEvent(username, 'started the game');
      break;
    default:
      throw new Error('Invalid type');
  }

  if (type === 'next' || type === 'skip') {
    createTossupCard(oldTossup);
  } else if (type === 'start') {
    document.getElementById('next').classList.add('btn-primary');
    document.getElementById('next').classList.remove('btn-success');
    document.getElementById('next').textContent = 'Next';
  }

  tossup = nextTossup;
  document.getElementById('packet-number-info').textContent = tossup?.packet.number ?? '-';
  document.getElementById('question-number-info').textContent = tossup?.number ?? '-';
  document.getElementById('set-name-info').textContent = tossup?.set.name ?? '';

  document.getElementById('answer').textContent = '';
  document.getElementById('question').textContent = '';

  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('buzz').disabled = false;
  document.getElementById('pause').textContent = 'Pause';
  document.getElementById('pause').disabled = false;
  document.getElementById('settings').classList.add('d-none');

  showSkipButton();
  updateTimerDisplay(100);
}

function noQuestionsFound () {
  window.alert('No questions found');
}

function pause ({ paused, username }) {
  logEvent(username, `${paused ? '' : 'un'}paused the game`);
}

function revealAnswer ({ answer, question }) {
  document.getElementById('question').innerHTML = question;
  document.getElementById('answer').innerHTML = 'ANSWER: ' + answer;
  document.getElementById('pause').disabled = true;
  showNextButton();
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

function setCategories ({ alternateSubcategories, categories, subcategories, username }) {
  logEvent(username, 'updated the categories');
  categoryManager.import(categories, subcategories, alternateSubcategories);
  categoryManager.loadCategoryModal();
}

function setDifficulties ({ difficulties, username = undefined }) {
  if (username) { logEvent(username, difficulties.length > 0 ? `set the difficulties to ${difficulties}` : 'cleared the difficulties'); }

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

function setPacketNumbers ({ username, packetNumbers }) {
  packetNumbers = arrayToRange(packetNumbers);
  logEvent(username, packetNumbers.length > 0 ? `changed packet numbers to ${packetNumbers}` : 'cleared packet numbers');
  document.getElementById('packet-number').value = packetNumbers;
}

function setReadingSpeed ({ username, readingSpeed }) {
  logEvent(username, `changed the reading speed to ${readingSpeed}`);
  document.getElementById('reading-speed').value = readingSpeed;
  document.getElementById('reading-speed-display').textContent = readingSpeed;
}

function setSetName ({ username, setName }) {
  logEvent(username, setName.length > 0 ? `changed set name to ${setName}` : 'cleared set name');
  document.getElementById('set-name').value = setName;
}

function setUsername ({ oldUsername, newUsername, userId }) {
  logEvent(oldUsername, `changed their username to ${newUsername}`);
  document.getElementById('username-' + userId).textContent = newUsername;
  players[userId].username = newUsername;
  sortPlayerListGroup();

  if (userId === USER_ID) {
    username = newUsername;
    window.localStorage.setItem('multiplayer-username', username);
    document.getElementById('username').value = username;
  }
}

function toggleLock ({ lock, username }) {
  logEvent(username, `${lock ? 'locked' : 'unlocked'} the room`);
  document.getElementById('toggle-lock').checked = lock;
}

function toggleLoginRequired ({ loginRequired, username }) {
  logEvent(username, `${loginRequired ? 'enabled' : 'disabled'} require players to be logged in`);
  document.getElementById('toggle-login-required').checked = loginRequired;
}

function togglePowermarkOnly ({ powermarkOnly, username }) {
  logEvent(username, `${powermarkOnly ? 'enabled' : 'disabled'} powermark only`);
  document.getElementById('toggle-powermark-only').checked = powermarkOnly;
}

function toggleRebuzz ({ rebuzz, username }) {
  logEvent(username, `${rebuzz ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
  document.getElementById('toggle-rebuzz').checked = rebuzz;
}

function toggleSelectBySetName ({ selectBySetName, setName, username }) {
  logEvent(username, 'enabled select by ' + (selectBySetName ? 'set name' : 'difficulty'));
  document.getElementById('toggle-select-by-set-name').checked = selectBySetName;
  document.getElementById('toggle-powermark-only').disabled = selectBySetName;
  document.getElementById('toggle-standard-only').disabled = selectBySetName;

  if (selectBySetName) {
    document.getElementById('difficulty-settings').classList.add('d-none');
    document.getElementById('set-settings').classList.remove('d-none');
    document.getElementById('set-name').textContent = setName;
  } else {
    document.getElementById('difficulty-settings').classList.remove('d-none');
    document.getElementById('set-settings').classList.add('d-none');
  }
}

function toggleSkip ({ skip, username }) {
  logEvent(username, `${skip ? 'enabled' : 'disabled'} skipping`);
  document.getElementById('toggle-skip').checked = skip;
  document.getElementById('skip').disabled = !skip || document.getElementById('skip').classList.contains('d-none');
}

function toggleStandardOnly ({ standardOnly, username }) {
  logEvent(username, `${standardOnly ? 'enabled' : 'disabled'} standard format only`);
  document.getElementById('toggle-standard-only').checked = standardOnly;
}

function toggleTimer ({ timer, username }) {
  logEvent(username, `${timer ? 'enabled' : 'disabled'} the timer`);
  document.getElementById('toggle-timer').checked = timer;
  document.getElementById('timer').classList.toggle('d-none');
}

function togglePublic ({ public: isPublic, username }) {
  logEvent(username, `made the room ${isPublic ? 'public' : 'private'}`);
  document.getElementById('chat').disabled = isPublic;
  document.getElementById('toggle-lock').disabled = isPublic;
  document.getElementById('toggle-login-required').disabled = isPublic;
  document.getElementById('toggle-timer').disabled = isPublic;
  document.getElementById('toggle-timer').checked = true;
  document.getElementById('toggle-public').checked = isPublic;

  if (isPublic) {
    document.getElementById('toggle-lock').checked = false;
    document.getElementById('toggle-login-required').checked = false;
  }
}

function updateQuestion ({ word }) {
  if (word === '(*)') { return; }
  document.getElementById('question').innerHTML += word + ' ';
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
  playerItem.setAttribute('data-bs-custom-class', 'custom-popover');
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

function setYearRange ({ minYear, maxYear, username }) {
  if (username) { logEvent(username, `changed the year range to ${minYear}-${maxYear}`); }

  $('#slider').slider('values', 0, minYear);
  $('#slider').slider('values', 1, maxYear);
  document.getElementById('year-range-a').textContent = minYear;
  document.getElementById('year-range-b').textContent = maxYear;
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const answer = document.getElementById('answer-input').value;
  socket.send(JSON.stringify({ type: 'give-answer', givenAnswer: answer }));
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
  if (range.some((num) => num < 1 || num > maxPacketNumber)) {
    document.getElementById('packet-number').classList.add('is-invalid');
    return;
  }

  document.getElementById('packet-number').classList.remove('is-invalid');
  socket.send(JSON.stringify({ type: 'set-packet-numbers', packetNumbers: range }));
});

document.getElementById('pause').addEventListener('click', function () {
  this.blur();
  const seconds = parseFloat(document.querySelector('.timer .face').innerText);
  const tenths = parseFloat(document.querySelector('.timer .fraction').innerText);
  const pausedTime = (seconds + tenths) * 10;
  socket.send(JSON.stringify({ type: 'pause', pausedTime }));
});

document.getElementById('reading-speed').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'set-reading-speed', readingSpeed: this.value }));
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

  socket.send(JSON.stringify({
    type: 'set-set-name',
    setName: this.value,
    packetNumbers: rangeToArray(document.getElementById('packet-number').value)
  }));
});

document.getElementById('toggle-lock').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-lock', lock: this.checked }));
});

document.getElementById('toggle-login-required').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-login-required', loginRequired: this.checked }));
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

document.getElementById('toggle-settings').addEventListener('click', function () {
  this.blur();
  document.getElementById('buttons').classList.toggle('col-lg-9');
  document.getElementById('buttons').classList.toggle('col-lg-12');
  document.getElementById('content').classList.toggle('col-lg-9');
  document.getElementById('content').classList.toggle('col-lg-12');
  document.getElementById('settings').classList.toggle('d-none');
  document.getElementById('settings').classList.toggle('d-lg-none');
});

document.getElementById('toggle-standard-only').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-standard-only', standardOnly: this.checked }));
});

document.getElementById('toggle-timer').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-timer', timer: this.checked }));
});

document.getElementById('toggle-public').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-public', public: this.checked }));
});

document.getElementById('username').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'set-username', userId: USER_ID, username: this.value }));
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
  socket.send(JSON.stringify({ type: 'set-year-range', minYear, maxYear }));
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
        socket.send(JSON.stringify({ type: 'set-categories', ...categoryManager.export() }));
      }
      oldCategories = JSON.stringify(categoryManager.export());
    }}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    onChange={() => socket.send(JSON.stringify({ type: 'set-difficulties', difficulties: getDropdownValues('difficulties') }))}
  />
);
