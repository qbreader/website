import Player from '../../../../quizbowl/Player.js';
import { getDropdownValues } from '../../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../../scripts/components/CategoryModal.jsx';
import DifficultyDropdown from '../../../scripts/components/DifficultyDropdown.jsx';
import aiBots from '../ai-mode/ai-bots.js';
import AIBot from '../ai-mode/AIBot.js';
import SoloTossupRoom from './SoloTossupRoom.js';
import SoloTossupClient from './SoloTossupClient.js';

const modeVersion = '2025-01-14';
const queryVersion = '2025-05-07';
const settingsVersion = '2024-10-16';
const USER_ID = 'user';

const room = new SoloTossupRoom();
room.players[USER_ID] = new Player(USER_ID);
const aiBot = new AIBot(room);
aiBot.setAIBot(aiBots['average-high-school'][0]);
aiBot.active = false;

const socket = { sendToServer: (message) => room.message(USER_ID, message) };
const client = new SoloTossupClient(room, USER_ID, socket, aiBot);
socket.send = (message) => client.onmessage(message);
room.sockets[USER_ID] = socket;

document.getElementById('choose-ai').addEventListener('change', function () {
  const prefix = 'ai-choice-';
  const choice = this.querySelector('input:checked').id.slice(prefix.length);
  aiBot.setAIBot(aiBots[choice][0]);
});

document.getElementById('local-packet-input').addEventListener('change', function (event) {
  const file = this.files[0];
  if (!file) { return; }
  const reader = new window.FileReader();
  reader.onload = function (e) {
    try {
      const packet = JSON.parse(e.target.result);
      socket.sendToServer({ type: 'upload-local-packet', packet, filename: file.name });
    } catch (error) {
      window.alert('Invalid packet format');
    }
  };
  reader.readAsText(file);
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  if (this.innerHTML === 'Skip') {
    socket.sendToServer({ type: 'skip' });
  } else {
    socket.sendToServer({ type: 'next' });
  }
});

document.getElementById('start').addEventListener('click', function () {
  socket.sendToServer({ type: 'start' });
});

document.getElementById('toggle-ai-mode').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-ai-mode', aiMode: this.checked });
});

document.getElementById('toggle-correct').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-correct', correct: this.textContent === 'I was right' });
});

document.getElementById('toggle-randomize-order').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-randomize-order', randomizeOrder: this.checked });
});

document.getElementById('type-to-answer').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-type-to-answer', typeToAnswer: this.checked });
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

  switch (event.key?.toLowerCase()) {
    case ' ':
      document.getElementById('buzz').click();
      // Prevent spacebar from scrolling the page
      if (event.target === document.body) { event.preventDefault(); }
      break;

    case 'e': return document.getElementById('toggle-settings').click();
    case 'k': return document.getElementsByClassName('card-header-clickable')[0].click();
    case 'n': return document.getElementById('next').click();
    case 'p': return document.getElementById('pause').click();
    case 's': return document.getElementById('start').click();
    case 't': return document.getElementsByClassName('star-tossup')[0].click();
    case 'y': return navigator.clipboard.writeText(room.tossup._id ?? '');
  }
});

if (window.localStorage.getItem('singleplayer-tossup-mode')) {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-tossup-mode'));
    if (savedQuery.version !== modeVersion) { throw new Error(); }
    socket.sendToServer({ type: 'set-mode', ...savedQuery });
  } catch {
    window.localStorage.removeItem('singleplayer-tossup-mode');
  }
}

let startingDifficulties = [];
if (window.localStorage.getItem('singleplayer-tossup-query')) {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-tossup-query'));
    if (savedQuery.version !== queryVersion) { throw new Error(); }
    room.categoryManager.import(savedQuery);
    room.query = savedQuery;
    socket.sendToServer({ type: 'set-packet-numbers', ...savedQuery, doNotFetch: true });
    socket.sendToServer({ type: 'set-set-name', ...savedQuery, doNotFetch: true });
    socket.sendToServer({ type: 'toggle-standard-only', ...savedQuery, doNotFetch: true });
    socket.sendToServer({ type: 'toggle-powermark-only', ...savedQuery });
    startingDifficulties = savedQuery.difficulties;
  } catch {
    window.localStorage.removeItem('singleplayer-tossup-query');
  }
}

$(document).ready(function () {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-tossup-query'));
    socket.sendToServer({ type: 'set-year-range', ...savedQuery });
  } catch {}
});

if (window.localStorage.getItem('singleplayer-tossup-settings')) {
  try {
    const savedSettings = JSON.parse(window.localStorage.getItem('singleplayer-tossup-settings'));
    if (savedSettings.version !== settingsVersion) { throw new Error(); }
    socket.sendToServer({ type: 'set-strictness', ...savedSettings });
    socket.sendToServer({ type: 'set-reading-speed', ...savedSettings });
    socket.sendToServer({ type: 'toggle-ai-mode', ...savedSettings });
    socket.sendToServer({ type: 'toggle-rebuzz', ...savedSettings });
    socket.sendToServer({ type: 'toggle-timer', ...savedSettings });
    socket.sendToServer({ type: 'toggle-type-to-answer', ...savedSettings });
  } catch {
    window.localStorage.removeItem('singleplayer-tossup-settings');
  }
}

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={room.categoryManager}
    onClose={() => socket.sendToServer({ type: 'set-categories', ...room.categoryManager.export() })}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    startingDifficulties={startingDifficulties ?? []}
    onChange={() => socket.sendToServer({ type: 'set-difficulties', difficulties: getDropdownValues('difficulties') })}
  />
);
