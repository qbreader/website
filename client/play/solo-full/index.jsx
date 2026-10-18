import CategoryManager from '../../../shared/category-manager.js';
import Player from '../../../shared/Player.js';
import Team from '../../../shared/Team.js';
import { QUESTION_TYPE_ENUM } from '../../../shared/constants.js';
import { TOSSUP_ROOM_MESSAGE_TYPE } from '../../../shared/protocol/tossup-room.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.jsx';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.jsx';
import SoloTossupBonusRoom from '../../rooms/SoloTossupBonusRoom.js';
import SoloTossupBonusClient, { storage } from '../../clients/SoloTossupBonusClient.js';

const USER_ID = 'user';
// the team id must equal the user id, as in multiplayer: TossupBonusClient compares the two
const TEAM_ID = USER_ID;

const room = new SoloTossupBonusRoom('', new CategoryManager());
room.players[USER_ID] = new Player(USER_ID);
room.players[USER_ID].teamId = TEAM_ID;
room.teams[TEAM_ID] = new Team(TEAM_ID);

const socket = { sendToServer: (message) => room.message({ userId: USER_ID, username: room.players[USER_ID]?.username }, message) };
const client = new SoloTossupBonusClient(room, USER_ID, socket);
socket.send = (message) => client.onmessage(message);
room.sockets[USER_ID] = socket;

/**
 * @param {{key: string, version: string}} item
 * @param {(saved: object) => void} restore - called with the saved object if it is current
 */
function restoreFromStorage ({ key, version }, restore) {
  const saved = window.localStorage.getItem(key);
  if (!saved) { return; }
  try {
    const parsed = JSON.parse(saved);
    if (parsed.version !== version) { throw new Error(); }
    restore(parsed);
  } catch {
    window.localStorage.removeItem(key);
  }
}

document.getElementById('local-packet-input').addEventListener('change', function (event) {
  const file = this.files[0];
  if (!file) { return; }
  const reader = new window.FileReader();
  reader.onload = function (e) {
    try {
      const packet = JSON.parse(e.target.result);
      if (!Array.isArray(packet.tossups) || !Array.isArray(packet.bonuses)) {
        window.alert('The packet must contain both tossups and bonuses');
        return;
      }
      socket.sendToServer({ type: 'upload-local-packet', packet, filename: file.name });
    } catch (error) {
      window.alert('Invalid packet format');
    }
  };
  reader.readAsText(file);
});

document.getElementById('toggle-correct').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_CORRECT, correct: this.textContent === 'I was right', targetUserId: USER_ID });
});

document.getElementById('toggle-randomize-order').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-randomize-order', randomizeOrder: this.checked });
});

document.getElementById('toggle-read-bonuses-like-tossups').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-read-bonuses-like-tossups', readBonusLikeATossup: this.checked });
});

document.getElementById('toggle-three-part-bonuses').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-three-part-bonuses', threePartBonuses: this.checked });
});

document.getElementById('type-to-answer').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-type-to-answer', typeToAnswer: this.checked });
});

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { return; }

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
    case 'k': return document.getElementsByClassName('card-header-clickable')[0]?.click();
    case 'n': return document.getElementById('next').click();
    case 'p': return document.getElementById('pause').click();
    case 's': return document.getElementById('next').click();
    // the newest history card is first in the DOM
    case 't': return document.querySelector('.star-tossup, .star-bonus')?.click();
    case 'y': return navigator.clipboard.writeText((room.currentQuestionType === QUESTION_TYPE_ENUM.BONUS ? room.bonus : room.tossup)._id ?? '');
    case '0': return document.getElementById(`checkbox-${room.pointsPerPart.length}`)?.click();
    case '1': return document.getElementById('checkbox-1')?.click();
    case '2': return document.getElementById('checkbox-2')?.click();
    case '3': return document.getElementById('checkbox-3')?.click();
    case '4': return document.getElementById('checkbox-4')?.click();
  }
});

restoreFromStorage(storage.mode, (savedMode) => {
  socket.sendToServer({ type: 'set-mode', ...savedMode });
});

let startingDifficulties = [];
restoreFromStorage(storage.query, (savedQuery) => {
  room.categoryManager.import(savedQuery);
  room.query = savedQuery;
  // need to set min year first to avoid conflicts between saved max year and default min year
  socket.sendToServer({ type: 'set-min-year', ...savedQuery, doNotFetch: true });
  socket.sendToServer({ type: 'set-max-year', ...savedQuery, doNotFetch: true });
  socket.sendToServer({ type: 'set-packet-numbers', ...savedQuery, doNotFetch: true });
  socket.sendToServer({ type: 'set-set-name', ...savedQuery, doNotFetch: true });
  socket.sendToServer({ type: 'toggle-standard-only', ...savedQuery, doNotFetch: true });
  socket.sendToServer({ type: 'toggle-powermark-only', ...savedQuery });
  socket.sendToServer({ type: 'toggle-three-part-bonuses', ...savedQuery });
  startingDifficulties = savedQuery.difficulties;
});

restoreFromStorage(storage.settings, (savedSettings) => {
  socket.sendToServer({ type: 'set-reading-speed', ...savedSettings });
  socket.sendToServer({ type: 'toggle-enable-bonuses', ...savedSettings });
  socket.sendToServer({ type: 'toggle-read-bonuses-like-tossups', ...savedSettings });
  socket.sendToServer({ type: 'toggle-rebuzz', ...savedSettings });
  socket.sendToServer({ type: 'toggle-stop-on-power', ...savedSettings });
  socket.sendToServer({ type: 'toggle-timer', ...savedSettings });
  socket.sendToServer({ type: 'toggle-type-to-answer', ...savedSettings });
});

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
