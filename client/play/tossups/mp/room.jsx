import MultiplayerTossupBonusClient from './MultiplayerTossupBonusClient.js';

import CategoryManager from '../../../../quizbowl/category-manager.js';
import { getDropdownValues } from '../../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../../scripts/components/CategoryModal.jsx';
import DifficultyDropdown from '../../../scripts/components/DifficultyDropdown.jsx';
import { MODE_ENUM } from '../../../../quizbowl/constants.js';
import getRandomName from '../../../../quizbowl/get-random-name.js';

const room = {
  categoryManager: new CategoryManager(),
  difficulties: [],
  mode: MODE_ENUM.RANDOM,
  muteList: [],
  ownerId: '',
  /**
   * userId to player object
   */
  players: {},
  public: true,
  setLength: 24,
  showingOffline: false,
  tossup: {},
  username: window.localStorage.getItem('multiplayer-username') || getRandomName()
};

let oldCategories = JSON.stringify(room.categoryManager.export());

const ROOM_NAME = decodeURIComponent(window.location.pathname.split('/').at(-1));
const USER_ID = window.localStorage.getItem('USER_ID') || 'unknown';

const socket = new window.WebSocket(
  window.location.href.replace('http', 'ws').split('?')[0] + '?' +
    new URLSearchParams({
      ...Object.fromEntries(new URLSearchParams(window.location.search)),
      roomName: ROOM_NAME,
      userId: USER_ID,
      username: room.username
    }).toString()
);
window.history.pushState({}, '', './' + encodeURIComponent(ROOM_NAME));

// Ping server every 30 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(
  () => socket.send(JSON.stringify({ type: 'ping' })),
  30000
);

socket.sendToServer = (data) => socket.send(JSON.stringify(data));

socket.onclose = function (event) {
  const { code } = event;
  if (code !== 3000) { window.alert('Disconnected from server'); }
  clearInterval(PING_INTERVAL_ID);
};

const client = new MultiplayerTossupBonusClient(room, USER_ID, socket);
socket.onmessage = (message) => client.onmessage(message);

document.getElementById('answer-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: 'give-answer-live-update', givenAnswer: this.value }));
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

const styleSheet = document.createElement('style');
styleSheet.textContent = room.showingOffline ? '' : '.offline { display: none; }';
document.head.appendChild(styleSheet);
document.getElementById('toggle-offline-players').addEventListener('click', function () {
  room.showingOffline = this.checked;
  this.blur();
  if (room.showingOffline) {
    styleSheet.textContent = '';
  } else {
    styleSheet.textContent = '.offline { display: none; }';
  }
});

document.getElementById('toggle-controlled').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-controlled', controlled: this.checked }));
});

document.getElementById('toggle-lock').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-lock', lock: this.checked }));
});

document.getElementById('toggle-login-required').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-login-required', loginRequired: this.checked }));
});

document.getElementById('toggle-skip').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-skip', skip: this.checked }));
});

document.getElementById('toggle-public').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-public', public: this.checked }));
});

document.getElementById('reveal').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'start-answer' }));
});

document.getElementById('username').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'set-username', userId: USER_ID, username: this.value }));
  room.username = this.value;
  window.localStorage.setItem('multiplayer-username', room.username);
});

document.addEventListener('keydown', (event) => {
  // press escape to close chat
  if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');
    document.getElementById('chat-input').blur();
    socket.send(JSON.stringify({ type: 'chat', message: '' }));
  }

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key?.toLowerCase()) {
    case ' ':
      // During bonus rounds, spacebar should reveal; during tossups, it should buzz
      if (!document.getElementById('reveal').disabled) {
        document.getElementById('reveal').click();
      } else {
        document.getElementById('buzz').click();
      }
      // Prevent spacebar from scrolling the page
      if (event.target === document.body) { event.preventDefault(); }
      break;

    case 'e': return document.getElementById('toggle-settings').click();
    case 'k': return document.getElementsByClassName('card-header-clickable')[0].click();
    case 'p': return document.getElementById('pause').click();
    case 't': return document.getElementsByClassName('star-tossup')[0].click();
    case 'y': return navigator.clipboard.writeText(room.tossup._id ?? '');

    case 'n':
    case 's':
      document.getElementById('next').click();
      document.getElementById('skip').click();
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

document.getElementById('username').value = room.username;

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={room.categoryManager}
    onClose={() => {
      if (oldCategories !== JSON.stringify(room.categoryManager.export())) {
        socket.send(JSON.stringify({ type: 'set-categories', ...room.categoryManager.export() }));
      }
      oldCategories = JSON.stringify(room.categoryManager.export());
    }}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    startingDifficulties={room.difficulties}
    onChange={() => socket.send(JSON.stringify({ type: 'set-difficulties', difficulties: getDropdownValues('difficulties') }))}
  />
);
