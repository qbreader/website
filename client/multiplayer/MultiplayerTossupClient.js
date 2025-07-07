import { MODE_ENUM } from '../../quizbowl/constants.js';
import questionStats from '../scripts/auth/question-stats.js';
import { arrayToRange } from '../scripts/utilities/ranges.js';
import upsertPlayerItem from '../scripts/upsertPlayerItem.js';
import TossupClient from '../play/TossupClient.js';

export default class MultiplayerTossupClient extends TossupClient {
  constructor (room, USER_ID, socket) {
    super(room, USER_ID);
    this.socket = socket;
  }

  onmessage (event) {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'chat': return this.chat(data, false);
      case 'chat-live-update': return this.chat(data, true);
      case 'clear-stats': return this.clearStats(data);
      case 'confirm-ban': return this.confirmBan(data);
      case 'connection-acknowledged': return this.connectionAcknowledged(data);
      case 'connection-acknowledged-query': return this.connectionAcknowledgedQuery(data);
      case 'connection-acknowledged-tossup': return this.connectionAcknowledgedTossup(data);
      case 'enforcing-removal': return this.ackRemovedFromRoom(data);
      case 'error': return this.handleError(data);
      case 'force-username': return this.forceUsername(data);
      case 'give-answer-live-update': return this.logGiveAnswer(data);
      case 'initiated-vk': return this.vkInit(data);
      case 'join': return this.join(data);
      case 'leave': return this.leave(data);
      case 'lost-buzzer-race': return this.lostBuzzerRace(data);
      case 'mute-player': return this.mutePlayer(data);
      case 'no-points-votekick-attempt': return this.failedVotekickPoints(data);
      case 'owner-change': return this.ownerChange(data);
      case 'set-username': return this.setUsername(data);
      case 'successful-vk': return this.vkHandle(data);
      case 'toggle-controlled': return this.toggleControlled(data);
      case 'toggle-lock': return this.toggleLock(data);
      case 'toggle-login-required': return this.toggleLoginRequired(data);
      case 'toggle-public': return this.togglePublic(data);
      default: return super.onmessage(event.data);
    }
  }

  // if a banned/kicked user tries to join a this.room they were removed from this is the response
  ackRemovedFromRoom ({ removalType }) {
    if (removalType === 'kick') {
      window.alert('You were kicked from this this.room by this.room.players, and cannot rejoin it.');
    } else {
      window.alert('You were banned from this this.room by the this.room owner, and cannot rejoin it.');
    }
    setTimeout(() => {
      window.location.replace('../');
    }, 100);
  }

  buzz ({ userId, username }) {
    this.logEventConditionally(username, 'buzzed');
    document.getElementById('skip').disabled = true;

    if (userId === this.USER_ID) {
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
    }
    super.buzz({ userId });
  }

  chat ({ message, userId, username }, live = false) {
    if (this.room.muteList.includes(userId)) {
      return;
    }
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

  clearStats ({ userId }) {
    for (const field of ['celerity', 'negs', 'points', 'powers', 'tens', 'tuh', 'zeroes']) {
      this.room.players[userId][field] = 0;
    }
    upsertPlayerItem(this.room.players[userId], this.USER_ID, this.room.ownerId, this.socket, this.room.public);
    this.sortPlayerListGroup();
  }

  confirmBan ({ targetId, targetUsername }) {
    if (targetId === this.USER_ID) {
      window.alert('You were banned from this this.room by the this.room owner.');
      setTimeout(() => {
        window.location.replace('../');
      }, 100);
    } else {
      this.logEventConditionally(targetUsername + ' has been banned from this this.room.');
    }
  }

  connectionAcknowledged ({
    buzzedIn,
    canBuzz,
    isPermanent,
    ownerId: serverOwnerId,
    mode,
    packetLength,
    players: messagePlayers,
    questionProgress,
    settings,
    setLength: newSetLength,
    userId
  }) {
    this.room.public = settings.public;
    this.room.ownerId = serverOwnerId;
    this.room.setLength = newSetLength;
    this.USER_ID = userId;
    window.localStorage.setItem('USER_ID', this.USER_ID);

    document.getElementById('buzz').disabled = !canBuzz;

    if (isPermanent) {
      document.getElementById('category-select-button').disabled = true;
      document.getElementById('permanent-this.room-warning').classList.remove('d-none');
      document.getElementById('reading-speed').disabled = true;
      document.getElementById('set-strictness').disabled = true;
      document.getElementById('set-mode').disabled = true;
      document.getElementById('toggle-public').disabled = true;
    }

    for (const userId of Object.keys(messagePlayers)) {
      messagePlayers[userId].celerity = messagePlayers[userId].celerity.correct.average;
      this.room.players[userId] = messagePlayers[userId];
      upsertPlayerItem(this.room.players[userId], this.USER_ID, this.room.ownerId, this.socket, this.room.public);
    }
    this.sortPlayerListGroup();

    this.setMode({ mode });

    document.getElementById('packet-length-info').textContent = mode === MODE_ENUM.SET_NAME ? packetLength : '-';

    switch (questionProgress) {
      case 0:
        document.getElementById('next').textContent = 'Start';
        document.getElementById('next').classList.remove('btn-primary');
        document.getElementById('next').classList.add('btn-success');
        break;
      case 1:
        this.showSkipButton();
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
        this.showNextButton();
        document.getElementById('settings').classList.add('d-none');
        break;
    }

    this.toggleLock({ lock: settings.lock });
    this.toggleLoginRequired({ loginRequired: settings.loginRequired });
    this.toggleRebuzz({ rebuzz: settings.rebuzz });
    this.toggleSkip({ skip: settings.skip });
    this.toggleTimer({ timer: settings.timer });
    this.setReadingSpeed({ readingSpeed: settings.readingSpeed });
    this.setStrictness({ strictness: settings.strictness });

    if (settings.controlled) {
      this.toggleControlled({ controlled: settings.controlled });
    }
    if (settings.public) {
      this.togglePublic({ public: settings.public });
    }
  }

  async connectionAcknowledgedQuery ({
    difficulties = [],
    minYear,
    maxYear,
    packetNumbers = [],
    powermarkOnly,
    setName = '',
    standardOnly,
    alternateSubcategories,
    categories,
    subcategories,
    percentView,
    categoryPercents
  }) {
    this.setDifficulties({ difficulties });

    document.getElementById('year-range-a').textContent = minYear;
    document.getElementById('year-range-b').textContent = maxYear;

    document.getElementById('packet-number').value = arrayToRange(packetNumbers);

    document.getElementById('toggle-powermark-only').checked = powermarkOnly;

    document.getElementById('set-name').value = setName;
    if (setName !== '' && this.room.setLength === 0) {
      document.getElementById('set-name').classList.add('is-invalid');
    }

    document.getElementById('toggle-standard-only').checked = standardOnly;

    this.setCategories({ categories, subcategories, alternateSubcategories, percentView, categoryPercents });

    $(document).ready(function () {
      $('#slider').slider('values', 0, minYear);
      $('#slider').slider('values', 1, maxYear);
    });
  }

  connectionAcknowledgedTossup ({ tossup: currentTossup }) {
    this.room.tossup = currentTossup;
    document.getElementById('set-name-info').textContent = this.room.tossup?.set?.name ?? '';
    document.getElementById('packet-number-info').textContent = this.room.tossup?.packet?.number ?? '-';
    document.getElementById('question-number-info').textContent = this.room.tossup?.number ?? '-';
  }

  failedVotekickPoints ({ userId }) {
    if (userId === this.USER_ID) {
      window.alert('You can only votekick once you have answered a question correctly!');
    }
  }

  forceUsername ({ message, username }) {
    window.alert(message);
    window.localStorage.setItem('multiplayer-username', username);
    document.querySelector('#username').value = username;
  }

  async giveAnswer ({ celerity, directive, directedPrompt, givenAnswer, perQuestionCelerity, score, tossup, userId, username }) {
    this.logGiveAnswer({ directive, givenAnswer, username });

    if (directive === 'prompt' && directedPrompt) {
      this.logEventConditionally(username, `was prompted with "${directedPrompt}"`);
    } else if (directive === 'prompt') {
      this.logEventConditionally(username, 'was prompted');
    } else {
      this.logEventConditionally(username, `${score > 0 ? '' : 'in'}correctly answered for ${score} points`);
    }

    super.giveAnswer({ directive, directedPrompt, score, userId });

    if (directive === 'prompt') { return; }

    document.getElementById('pause').disabled = false;

    if (directive === 'accept') {
      document.getElementById('buzz').disabled = true;
      Array.from(document.getElementsByClassName('tuh')).forEach(element => {
        element.textContent = parseInt(element.innerHTML) + 1;
      });
    }

    if (directive === 'reject') {
      document.getElementById('buzz').disabled = !document.getElementById('toggle-rebuzz').checked && userId === this.USER_ID;
    }

    if (score > 10) {
      this.room.players[userId].powers++;
    } else if (score === 10) {
      this.room.players[userId].tens++;
    } else if (score < 0) {
      this.room.players[userId].negs++;
    }

    this.room.players[userId].points += score;
    this.room.players[userId].tuh++;
    this.room.players[userId].celerity = celerity;

    upsertPlayerItem(this.room.players[userId], this.USER_ID, this.room.ownerId, this.socket, this.room.public);
    this.sortPlayerListGroup();

    if (userId === this.USER_ID) {
      questionStats.recordTossup({
        _id: tossup._id,
        celerity: perQuestionCelerity,
        isCorrect: score > 0,
        multiplayer: true,
        pointValue: score
      });
    }
  }

  handleError ({ message }) {
    this.socket.close(3000);
    window.alert(message);
    window.location.href = '/multiplayer';
  }

  join ({ isNew, user, userId, username }) {
    this.logEventConditionally(username, 'joined the game');
    if (userId === this.USER_ID) { return; }
    this.room.players[userId] = user;

    if (isNew) {
      user.celerity = user.celerity.correct.average;
      upsertPlayerItem(user, this.USER_ID, this.room.ownerId, this.socket, this.room.public);
      this.sortPlayerListGroup();
    } else {
      document.getElementById(`list-group-${userId}`).classList.remove('offline');
      document.getElementById('points-' + userId).classList.add('bg-success');
      document.getElementById('points-' + userId).classList.remove('bg-secondary');
      document.getElementById('username-' + userId).textContent = username;
    }
  }

  leave ({ userId, username }) {
    this.logEventConditionally(username, 'left the game');
    this.room.players[userId].online = false;
    document.getElementById(`list-group-${userId}`).classList.add('offline');
    document.getElementById(`points-${userId}`).classList.remove('bg-success');
    document.getElementById(`points-${userId}`).classList.add('bg-secondary');
  }

  /**
 * Log the event, but only if `username !== undefined`.
 * If username is undefined, do nothing, regardless of the value of message.
 * @param {string | undefined} username
 * @param {string | undefined} message
 */
  logEventConditionally (username, message) {
    if (username === undefined) { return; }

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

  logGiveAnswer ({ directive = null, givenAnswer, username }) {
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
    span.textContent = givenAnswer;

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

  lostBuzzerRace ({ username, userId }) {
    this.logEventConditionally(username, 'lost the buzzer race');
    if (userId === this.USER_ID) { document.getElementById('answer-input-group').classList.add('d-none'); }
  }

  mutePlayer ({ targetId, targetUsername, muteStatus }) {
    if (muteStatus === 'Mute') {
      if (!this.room.muteList.includes(targetId)) {
        this.room.muteList.push(targetId);
        this.logEventConditionally(targetUsername, 'was muted');
      }
    } else {
      if (this.room.muteList.includes(targetId)) {
        this.room.muteList = this.room.muteList.filter(Id => Id !== targetId);
        this.logEventConditionally(targetUsername, 'was unmuted');
      }
    }
  }

  next ({ packetLength, oldTossup, tossup: nextTossup, type, username }) {
    const typeStrings = {
      end: 'ended the game',
      next: 'went to the next question',
      skip: 'skipped the question',
      start: 'started the game'
    };
    this.logEventConditionally(username, typeStrings[type]);

    super.next({ nextTossup, oldTossup, packetLength, type });

    if (type === 'start') {
      document.getElementById('next').classList.add('btn-primary');
      document.getElementById('next').classList.remove('btn-success');
      document.getElementById('next').textContent = 'Next';
    }

    if (type === 'end') {
      document.getElementById('next').classList.remove('btn-primary');
      document.getElementById('next').classList.add('btn-success');
      document.getElementById('next').textContent = 'Start';
    } else {
      this.room.tossup = nextTossup;
    }

    this.showSkipButton();
  }

  ownerChange ({ newOwner }) {
    if (this.room.players[newOwner]) {
      this.room.ownerId = newOwner;
      this.logEventConditionally(this.room.players[newOwner].username, 'became the this.room owner');
    } else this.logEventConditionally(newOwner, 'became the this.room owner');

    Object.keys(this.room.players).forEach((player) => {
      upsertPlayerItem(this.room.players[player], this.USER_ID, this.room.ownerId, this.socket, this.room.public);
    });

    document.getElementById('toggle-controlled').disabled = this.room.public || (this.room.ownerId !== this.USER_ID);
  }

  pause ({ paused, username }) {
    this.logEventConditionally(username, `${paused ? '' : 'un'}paused the game`);
    super.pause({ paused });
  }

  revealAnswer ({ answer, question }) {
    super.revealAnswer({ answer, question });
    this.showNextButton();
  }

  setCategories ({ alternateSubcategories, categories, subcategories, percentView, categoryPercents, username }) {
    this.logEventConditionally(username, 'updated the categories');
    this.room.categoryManager.import({ categories, subcategories, alternateSubcategories, percentView, categoryPercents });
    if (!document.getElementById('category-modal')) { return; }
    super.setCategories();
  }

  setDifficulties ({ difficulties, username = undefined }) {
    this.logEventConditionally(username, difficulties.length > 0 ? `set the difficulties to ${difficulties}` : 'cleared the difficulties');

    if (!document.getElementById('difficulties')) {
      this.room.difficulties = difficulties;
      return;
    }

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

  setMode ({ mode, setName, username }) {
    this.logEventConditionally(username, 'changed the mode to ' + mode);

    this.room.mode = mode;
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document.getElementById('set-name').textContent = setName;
        break;
      case MODE_ENUM.RANDOM:
        break;
    }

    super.setMode({ mode });
  }

  setPacketNumbers ({ username, packetNumbers }) {
    super.setPacketNumbers({ packetNumbers });
    this.logEventConditionally(username, packetNumbers.length > 0 ? `changed packet numbers to ${arrayToRange(packetNumbers)}` : 'cleared packet numbers');
  }

  setReadingSpeed ({ username, readingSpeed }) {
    super.setReadingSpeed({ readingSpeed });
    this.logEventConditionally(username, `changed the reading speed to ${readingSpeed}`);
  }

  setStrictness ({ strictness, username }) {
    this.logEventConditionally(username, `changed the strictness to ${strictness}`);
    super.setStrictness({ strictness });
  }

  setSetName ({ username, setName, setLength }) {
    this.logEventConditionally(username, setName.length > 0 ? `changed set name to ${setName}` : 'cleared set name');
    this.room.setLength = setLength;
    super.setSetName({ setName, setLength });
  }

  setUsername ({ oldUsername, newUsername, userId }) {
    this.logEventConditionally(oldUsername, `changed their username to ${newUsername}`);
    document.getElementById('username-' + userId).textContent = newUsername;
    this.room.players[userId].username = newUsername;
    this.sortPlayerListGroup();

    if (userId === this.USER_ID) {
      this.room.username = newUsername;
      window.localStorage.setItem('multiplayer-username', this.room.username);
      document.getElementById('username').value = this.room.username;
    }
    upsertPlayerItem(this.room.players[userId], this.USER_ID, this.room.ownerId, this.socket, this.room.public);
  }

  setYearRange ({ minYear, maxYear, username }) {
    this.logEventConditionally(username, `changed the year range to ${minYear}-${maxYear}`);
    super.setYearRange({ minYear, maxYear });
  }

  showNextButton () {
    document.getElementById('next').classList.remove('d-none');
    document.getElementById('next').disabled = false;
    document.getElementById('skip').classList.add('d-none');
    document.getElementById('skip').disabled = true;
  }

  showSkipButton () {
    document.getElementById('skip').classList.remove('d-none');
    document.getElementById('skip').disabled = !document.getElementById('toggle-skip').checked;
    document.getElementById('next').classList.add('d-none');
    document.getElementById('next').disabled = true;
  }

  sortPlayerListGroup (descending = true) {
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

  toggleControlled ({ controlled, username }) {
    this.logEventConditionally(username, `${controlled ? 'enabled' : 'disabled'} controlled mode`);

    document.getElementById('toggle-controlled').checked = controlled;
    document.getElementById('controlled-this.room-warning').classList.toggle('d-none', !controlled);
    document.getElementById('toggle-public').disabled = controlled;

    controlled = controlled && (this.USER_ID !== this.room.ownerId);
    document.getElementById('toggle-lock').disabled = controlled;
    document.getElementById('toggle-login-required').disabled = controlled;
    document.getElementById('toggle-timer').disabled = controlled;
    document.getElementById('toggle-powermark-only').disabled = controlled;
    document.getElementById('toggle-rebuzz').disabled = controlled;
    document.getElementById('toggle-skip').disabled = controlled;
    document.getElementById('toggle-standard-only').disabled = controlled;

    document.getElementById('category-select-button').disabled = controlled;
    document.getElementById('reading-speed').disabled = controlled;
    document.getElementById('set-mode').disabled = controlled;
    document.getElementById('set-strictness').disabled = controlled;
  }

  toggleLock ({ lock, username }) {
    this.logEventConditionally(username, `${lock ? 'locked' : 'unlocked'} the this.room`);
    document.getElementById('toggle-lock').checked = lock;
  }

  toggleLoginRequired ({ loginRequired, username }) {
    this.logEventConditionally(username, `${loginRequired ? 'enabled' : 'disabled'} require this.room.players to be logged in`);
    document.getElementById('toggle-login-required').checked = loginRequired;
  }

  togglePowermarkOnly ({ powermarkOnly, username }) {
    this.logEventConditionally(username, `${powermarkOnly ? 'enabled' : 'disabled'} powermark only`);
    super.togglePowermarkOnly({ powermarkOnly });
  }

  toggleRebuzz ({ rebuzz, username }) {
    this.logEventConditionally(username, `${rebuzz ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
    super.toggleRebuzz({ rebuzz });
  }

  toggleSkip ({ skip, username }) {
    this.logEventConditionally(username, `${skip ? 'enabled' : 'disabled'} skipping`);
    document.getElementById('toggle-skip').checked = skip;
    document.getElementById('skip').disabled = !skip || document.getElementById('skip').classList.contains('d-none');
  }

  toggleStandardOnly ({ standardOnly, username }) {
    this.logEventConditionally(username, `${standardOnly ? 'enabled' : 'disabled'} standard format only`);
    super.toggleStandardOnly({ standardOnly });
  }

  toggleTimer ({ timer, username }) {
    this.logEventConditionally(username, `${timer ? 'enabled' : 'disabled'} the timer`);
    super.toggleTimer({ timer });
  }

  togglePublic ({ public: isPublic, username }) {
    this.logEventConditionally(username, `made the this.room ${isPublic ? 'public' : 'private'}`);
    document.getElementById('chat').disabled = isPublic;
    document.getElementById('toggle-controlled').disabled = isPublic || (this.room.ownerId !== this.USER_ID);
    document.getElementById('toggle-lock').disabled = isPublic;
    document.getElementById('toggle-login-required').disabled = isPublic;
    document.getElementById('toggle-public').checked = isPublic;
    document.getElementById('toggle-timer').disabled = isPublic;
    this.room.public = isPublic;
    if (isPublic) {
      document.getElementById('toggle-lock').checked = false;
      document.getElementById('toggle-login-required').checked = false;
      this.toggleTimer({ timer: true });
    }
    Object.keys(this.room.players).forEach((player) => {
      upsertPlayerItem(this.room.players[player], this.USER_ID, this.room.ownerId, this.socket, this.room.public);
    });
  }

  vkInit ({ targetUsername, threshold }) {
    this.logEventConditionally(`A votekick has been started against user ${targetUsername} and needs ${threshold} votes to succeed.`);
  }

  vkHandle ({ targetUsername, targetId }) {
    if (this.USER_ID === targetId) {
      window.alert('You were vote kicked from this this.room by others.');
      setTimeout(() => {
        window.location.replace('../');
      }, 100);
    } else {
      this.logEventConditionally(targetUsername + ' has been vote kicked from this this.room.');
    }
  }
}
