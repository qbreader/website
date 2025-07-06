import { MODE_ENUM } from '../../../quizbowl/constants.js';
import audio from '../../audio/index.js';
import api from '../../scripts/api/index.js';
import questionStats from '../../scripts/auth/question-stats.js';
import { arrayToRange } from '../../scripts/utilities/ranges.js';
import createBonusGameCard from '../../scripts/utilities/bonus-game-card.js';
import BonusClient from '../../play/BonusClient.js';

const modeVersion = '2025-01-14';
const queryVersion = '2025-05-07';
const settingsVersion = '2024-11-02';

export default class SingleplayerBonusClient extends BonusClient {
  constructor (room, USER_ID) {
    super(room, USER_ID);
    this.room = room;
    this.USER_ID = USER_ID;
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'alert': return window.alert(data.message);
      case 'clear-stats': return this.clearStats(data);
      case 'end': return this.next(data);
      case 'give-answer': return this.giveAnswer(data);
      case 'next': return this.next(data);
      case 'reveal-leadin': return this.revealLeadin(data);
      case 'reveal-next-answer': return this.revealNextAnswer(data);
      case 'reveal-next-part': return this.revealNextPart(data);
      case 'set-categories': return this.setCategories(data);
      case 'set-difficulties': return this.setDifficulties(data);
      case 'set-mode': return this.setMode(data);
      case 'set-packet-numbers': return this.setPacketNumbers(data);
      case 'set-set-name': return this.setSetName(data);
      case 'set-strictness': return this.setStrictness(data);
      case 'set-year-range': return this.setYearRange(data);
      case 'skip': return this.next(data);
      case 'start': return this.next(data);
      case 'start-answer': return this.startAnswer(data);
      case 'timer-update': return this.updateTimerDisplay(data.timeRemaining);
      case 'toggle-correct': return this.toggleCorrect(data);
      case 'toggle-show-history': return this.toggleShowHistory(data);
      case 'toggle-standard-only': return this.toggleStandardOnly(data);
      case 'toggle-three-part-bonuses': return this.toggleThreePartBonuses(data);
      case 'toggle-timer': return this.toggleTimer(data);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(data);
    }
  }

  clearStats ({ teamId }) {
    this.updateStatDisplay({ 0: 0, 10: 0, 20: 0, 30: 0 });
  }

  async giveAnswer ({ currentPartNumber, directive, directedPrompt }) {
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

    switch (directive) {
      case 'accept':
        document.getElementById(`checkbox-${currentPartNumber + 1}`).checked = true;
        document.getElementById('reveal').disabled = false;
        if (audio.soundEffects) {
          audio.correct.play();
        }
        break;
      case 'reject':
        document.getElementById('reveal').disabled = false;
        if (audio.soundEffects) {
          audio.incorrect.play();
        }
        break;
    }
  }

  async next ({ type, bonus, lastPartRevealed, oldBonus, packetLength, pointsPerPart, stats, teamId }) {
    if (type === 'start') {
      document.getElementById('next').disabled = false;
      document.getElementById('settings').classList.add('d-none');
    }

    if (type !== 'start') {
      createBonusGameCard({
        bonus: oldBonus,
        starred: this.room.mode === MODE_ENUM.STARRED ? true : (this.room.mode === MODE_ENUM.LOCAL ? false : null)
      });
    }

    document.getElementById('question').textContent = '';

    if (type === 'end') {
      document.getElementById('next').disabled = true;
      document.getElementById('reveal').disabled = true;
    } else {
      document.getElementById('next').textContent = 'Skip';
      document.getElementById('packet-length-info').textContent = this.room.mode === MODE_ENUM.SET_NAME ? packetLength : '-';
      document.getElementById('packet-number-info').textContent = bonus.packet.number;
      document.getElementById('reveal').disabled = false;
      document.getElementById('set-name-info').textContent = bonus.set.name;
      document.getElementById('question-number-info').textContent = bonus.number;
    }

    if (lastPartRevealed && (this.room.mode !== MODE_ENUM.LOCAL)) {
      questionStats.recordBonus({ _id: oldBonus._id, pointsPerPart });
      this.updateStatDisplay(stats);
    }
  }

  /**
 * Called when the users wants to reveal the next bonus part.
 */
  revealNextAnswer ({ answer, currentPartNumber, lastPartRevealed }) {
    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'ANSWER: ' + answer;
    document.getElementById(`bonus-part-${currentPartNumber + 1}`).appendChild(paragraph);

    if (lastPartRevealed) {
      document.getElementById('reveal').disabled = true;
      document.getElementById('next').textContent = 'Next';
    }
  }

  revealLeadin ({ leadin }) {
    const paragraph = document.createElement('p');
    paragraph.id = 'leadin';
    paragraph.innerHTML = leadin;
    document.getElementById('question').appendChild(paragraph);
  }

  revealNextPart ({ currentPartNumber, part, value }) {
    const input = document.createElement('input');
    input.id = `checkbox-${currentPartNumber + 1}`;
    input.className = 'checkbox form-check-input rounded-0 me-1';
    input.type = 'checkbox';
    input.style = 'width: 20px; height: 20px; cursor: pointer';
    input.addEventListener('click', function () {
      this.room.message.sendToServer({ type: 'toggle-correct', partNumber: currentPartNumber, correct: this.checked });
    });

    const inputWrapper = document.createElement('label');
    inputWrapper.style = 'cursor: pointer';
    inputWrapper.appendChild(input);

    const p = document.createElement('p');
    p.innerHTML = `[${value}] ${part}`;

    const bonusPart = document.createElement('div');
    bonusPart.id = `bonus-part-${currentPartNumber + 1}`;
    bonusPart.appendChild(p);

    const row = document.createElement('div');
    row.className = 'd-flex';
    row.appendChild(inputWrapper);
    row.appendChild(bonusPart);

    document.getElementById('question').appendChild(row);
  }

  setCategories ({ alternateSubcategories, categories, subcategories, percentView, categoryPercents }) {
    this.room.categoryManager.loadCategoryModal();
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setDifficulties ({ difficulties }) {
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setPacketNumbers ({ packetNumbers }) {
    document.getElementById('packet-number').value = arrayToRange(packetNumbers);
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  async setSetName ({ setName, setLength }) {
    document.getElementById('set-name').value = setName;
    // make border red if set name is not in set list
    const valid = !setName || api.getSetList().includes(setName);
    document.getElementById('set-name').classList.toggle('is-invalid', !valid);
    document.getElementById('packet-number').placeholder = 'Packet Numbers' + (setLength ? ` (1-${setLength})` : '');
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setStrictness ({ strictness }) {
    document.getElementById('set-strictness').value = strictness;
    document.getElementById('strictness-display').textContent = strictness;
    window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  setYearRange ({ minYear, maxYear }) {
    $('#slider').slider('values', [minYear, maxYear]);
    document.getElementById('year-range-a').textContent = minYear;
    document.getElementById('year-range-b').textContent = maxYear;
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  startAnswer () {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('reveal').disabled = true;
  }

  toggleCorrect ({ partNumber, correct }) {
    document.getElementById(`checkbox-${partNumber + 1}`).checked = correct;
  }

  setMode ({ mode }) {
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        document.getElementById('toggle-standard-only').disabled = true;
        document.getElementById('toggle-three-part-bonuses').disabled = true;
        break;
      case MODE_ENUM.RANDOM:
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('local-packet-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-standard-only').disabled = false;
        document.getElementById('toggle-three-part-bonuses').disabled = false;
        break;
      case MODE_ENUM.STARRED:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-standard-only').disabled = true;
        document.getElementById('toggle-three-part-bonuses').disabled = true;
        break;
      case MODE_ENUM.LOCAL:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-standard-only').disabled = true;
        document.getElementById('toggle-three-part-bonuses').disabled = true;
        break;
    }
    document.getElementById('set-mode').value = mode;
    window.localStorage.setItem('singleplayer-bonus-mode', JSON.stringify({ mode, version: modeVersion }));
  }

  toggleShowHistory ({ showHistory }) {
    document.getElementById('room-history').classList.toggle('d-none', !showHistory);
    document.getElementById('toggle-show-history').checked = showHistory;
    window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  toggleStandardOnly ({ standardOnly }) {
    document.getElementById('toggle-standard-only').checked = standardOnly;
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleThreePartBonuses ({ threePartBonuses }) {
    document.getElementById('toggle-three-part-bonuses').checked = threePartBonuses;
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleTimer ({ timer }) {
    document.getElementById('timer').classList.toggle('d-none', !timer);
    document.getElementById('toggle-timer').checked = timer;
    window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  toggleTypeToAnswer ({ typeToAnswer }) {
    document.getElementById('type-to-answer').checked = typeToAnswer;
    window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  /**
 * Calculates the points per bonus and updates the display.
 */
  updateStatDisplay (stats) {
    const numBonuses = stats[0] + stats[10] + stats[20] + stats[30];
    const points = 30 * stats[30] + 20 * stats[20] + 10 * stats[10];
    const ppb = Math.round(100 * points / numBonuses) / 100 || 0;
    const includePlural = (numBonuses === 1) ? '' : 'es';
    document.getElementById('statline').textContent = `${ppb} PPB with ${numBonuses} bonus${includePlural} seen (${stats[30]}/${stats[20]}/${stats[10]}/${stats[0]}, ${points} pts)`;
  }

  updateTimerDisplay (time) {
    const seconds = Math.floor(time / 10);
    const tenths = time % 10;
    document.querySelector('.timer .face').textContent = seconds;
    document.querySelector('.timer .fraction').textContent = '.' + tenths;
  }
}
