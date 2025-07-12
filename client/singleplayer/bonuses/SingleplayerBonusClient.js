import { MODE_ENUM } from '../../../quizbowl/constants.js';
import questionStats from '../../scripts/auth/question-stats.js';
import BonusClient from '../../play/BonusClient.js';

const modeVersion = '2025-01-14';
const queryVersion = '2025-05-07';
const settingsVersion = '2024-11-02';

export default class SingleplayerBonusClient extends BonusClient {
  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'clear-stats': return this.clearStats(data);
      case 'reveal-leadin': return this.revealLeadin(data);
      case 'reveal-next-answer': return this.revealNextAnswer(data);
      case 'reveal-next-part': return this.revealNextPart(data);
      case 'start-answer': return this.startAnswer(data);
      case 'toggle-correct': return this.toggleCorrect(data);
      case 'toggle-show-history': return this.toggleShowHistory(data);
      case 'toggle-three-part-bonuses': return this.toggleThreePartBonuses(data);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(data);
      default: return super.onmessage(message);
    }
  }

  clearStats ({ teamId }) {
    this.updateStatDisplay({ 0: 0, 10: 0, 20: 0, 30: 0 });
  }

  async giveAnswer ({ currentPartNumber, directive, directedPrompt, userId }) {
    super.giveAnswer({ currentPartNumber, directive, directedPrompt, userId });
  }

  async next ({ type, bonus, lastPartRevealed, oldBonus, packetLength, pointsPerPart, stats, teamId }) {
    const starred = this.room.mode === MODE_ENUM.STARRED ? true : (this.room.mode === MODE_ENUM.LOCAL ? false : null);
    super.next({ bonus, oldBonus, packetLength, starred, type });

    if (type === 'start') {
      document.getElementById('next').disabled = false;
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

    const room = this.room;
    const USER_ID = this.USER_ID;
    input.addEventListener('click', function () {
      room.message(USER_ID, { type: 'toggle-correct', partNumber: currentPartNumber, correct: this.checked });
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
    super.setCategories();
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setDifficulties ({ difficulties }) {
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setPacketNumbers ({ packetNumbers }) {
    super.setPacketNumbers({ packetNumbers });
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  async setSetName ({ setName, setLength }) {
    super.setSetName({ setName, setLength });
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setStrictness ({ strictness }) {
    super.setStrictness({ strictness });
    window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  setYearRange ({ minYear, maxYear }) {
    super.setYearRange({ minYear, maxYear });
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
        document.getElementById('local-packet-settings').classList.add('d-none');
        break;
      case MODE_ENUM.RANDOM:
        document.getElementById('local-packet-settings').classList.add('d-none');
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
    super.setMode({ mode });
    window.localStorage.setItem('singleplayer-bonus-mode', JSON.stringify({ mode, version: modeVersion }));
  }

  toggleShowHistory ({ showHistory }) {
    document.getElementById('room-history').classList.toggle('d-none', !showHistory);
    document.getElementById('toggle-show-history').checked = showHistory;
    window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  toggleStandardOnly ({ standardOnly }) {
    super.toggleStandardOnly({ standardOnly });
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleThreePartBonuses ({ threePartBonuses }) {
    document.getElementById('toggle-three-part-bonuses').checked = threePartBonuses;
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleTimer ({ timer }) {
    super.toggleTimer({ timer });
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
}
