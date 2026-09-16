import MultiplayerTossupBonusClient from '../../clients/MultiplayerTossupBonusClient.js';
import { MULTIPLAYER_ROOM_MESSAGE_TYPE } from '../../../shared/protocol/multiplayer-room.js';
import { ROOM_MESSAGE_TYPE } from '../../../shared/protocol/room.js';
import { showAlert } from './alert.js';

import CategoryManager from '../../../shared/category-manager.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.jsx';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.jsx';
import { MODE_ENUM } from '../../../shared/constants.js';
import getRandomName from '../../../shared/get-random-name.js';

const room = {
  bonus: {},
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
  teams: {},
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
  if (code !== 3000) { showAlert('Disconnected from server'); }
  clearInterval(PING_INTERVAL_ID);
};

const client = new MultiplayerTossupBonusClient(room, USER_ID, socket);
socket.onmessage = (message) => client.onmessage(message);

document.getElementById('answer-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.GIVE_ANSWER_LIVE_UPDATE, givenAnswer: this.value }));
});

document.getElementById('chat').addEventListener('click', function () {
  this.blur();
  document.getElementById('chat-input-group').classList.remove('d-none');
  document.getElementById('chat-input').focus();
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.CHAT_LIVE_UPDATE, message: '' }));
});

document.getElementById('chat-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const message = document.getElementById('chat-input').value;
  document.getElementById('chat-input').value = '';
  document.getElementById('chat-input-group').classList.add('d-none');
  document.getElementById('chat-input').blur();

  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.CHAT, message }));
});

document.getElementById('chat-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.CHAT_LIVE_UPDATE, message: this.value }));
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
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.TOGGLE_CONTROLLED, controlled: this.checked }));
});

document.getElementById('toggle-lock').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.TOGGLE_LOCK, lock: this.checked }));
});

document.getElementById('toggle-login-required').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.TOGGLE_LOGIN_REQUIRED, loginRequired: this.checked }));
});

document.getElementById('toggle-skip').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-skip', skip: this.checked }));
});

document.getElementById('toggle-public').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.TOGGLE_PUBLIC, public: this.checked }));
});

document.getElementById('username').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: ROOM_MESSAGE_TYPE.SET_USERNAME, userId: USER_ID, username: this.value }));
  room.username = this.value;
  window.localStorage.setItem('multiplayer-username', room.username);
});

document.addEventListener('keydown', (event) => {
  // press escape to close chat
  if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');
    document.getElementById('chat-input').blur();
    socket.send(JSON.stringify({ type: MULTIPLAYER_ROOM_MESSAGE_TYPE.CHAT, message: '' }));
  }

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key?.toLowerCase()) {
    case ' ':
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
    case 's': return document.getElementById('next').click();
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
