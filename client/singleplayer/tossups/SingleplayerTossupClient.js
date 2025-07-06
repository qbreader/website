import { MODE_ENUM } from '../../../quizbowl/constants.js';
import api from '../../scripts/api/index.js';
import questionStats from '../../scripts/auth/question-stats.js';
import { arrayToRange } from '../../scripts/utilities/ranges.js';
import upsertPlayerItem from '../../scripts/upsertPlayerItem.js';
import TossupClient from '../../play/TossupClient.js';

const modeVersion = '2025-01-14';
const queryVersion = '2025-05-07';
const settingsVersion = '2024-11-02';

export default class SingleplayerTossupClient extends TossupClient {
  constructor (room, USER_ID, aiBot) {
    super(room, USER_ID);
    this.room = room;
    this.USER_ID = USER_ID;
    this.aiBot = aiBot;
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'alert': return window.alert(data.message);
      case 'buzz': return this.buzz(data);
      case 'clear-stats': return this.clearStats(data);
      case 'give-answer': return this.giveAnswer(data);
      case 'reveal-answer': return this.revealAnswer(data);
      case 'set-categories': return this.setCategories(data);
      case 'set-difficulties': return this.setDifficulties(data);
      case 'set-mode': return this.setMode(data);
      case 'set-strictness': return this.setStrictness(data);
      case 'set-packet-numbers': return this.setPacketNumbers(data);
      case 'set-set-name': return this.setSetName(data);
      case 'set-year-range': return this.setYearRange(data);
      case 'timer-update': return this.updateTimerDisplay(data.timeRemaining);
      case 'toggle-ai-mode': return this.toggleAiMode(data);
      case 'toggle-correct': return this.toggleCorrect(data);
      case 'toggle-show-history': return this.toggleShowHistory(data);
      case 'toggle-standard-only': return this.toggleStandardOnly(data);
      case 'toggle-timer': return this.toggleTimer(data);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(data);
      case 'update-question': return this.updateQuestion(data);
    }
  }

  buzz ({ timer, userId, username }) {
    if (userId !== this.USER_ID) { return; }

    const typeToAnswer = document.getElementById('type-to-answer').checked;
    if (typeToAnswer) {
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
    }
    super.buzz();
  }

  clearStats ({ userId }) {
    this.updateStatDisplay(this.room.players[userId]);
  }

  async giveAnswer ({ directive, directedPrompt, perQuestionCelerity, score, tossup, userId }) {
    super.giveAnswer({ directive, directedPrompt, score, userId });

    if (directive === 'prompt') { return; }

    if (userId === this.USER_ID) {
      this.updateStatDisplay(this.room.players[this.USER_ID]);
    } else if (this.aiBot.active) {
      upsertPlayerItem(this.aiBot.player);
    }

    if (this.room.settings.rebuzz && directive === 'reject') {
      document.getElementById('buzz').disabled = false;
      document.getElementById('buzz').textContent = 'Buzz';
      document.getElementById('pause').disabled = false;
    }
  }

  async next ({ packetLength, oldTossup, tossup: nextTossup, type }) {
    const starred = this.room.mode === MODE_ENUM.STARRED ? true : (this.room.mode === MODE_ENUM.LOCAL ? false : null);
    super.next({ nextTossup, oldTossup, packetLength, starred, type });

    if (type === 'start') {
      document.getElementById('next').disabled = false;
    }

    document.getElementById('toggle-correct').textContent = 'I was wrong';
    document.getElementById('toggle-correct').classList.add('d-none');

    if (type === 'end') {
      document.getElementById('next').disabled = true;
      document.getElementById('pause').disabled = true;
    } else {
      document.getElementById('next').textContent = 'Skip';
    }

    if ((type === 'end' || type === 'next') && this.room.previous.userId === this.USER_ID && (this.room.mode !== MODE_ENUM.LOCAL)) {
      const pointValue = this.room.previous.isCorrect ? (this.room.previous.inPower ? this.room.previous.powerValue : 10) : (this.room.previous.endOfQuestion ? 0 : this.room.previous.negValue);
      questionStats.recordTossup({
        _id: this.room.previous.tossup._id,
        celerity: this.room.previous.celerity,
        isCorrect: this.room.previous.isCorrect,
        multiplayer: false,
        pointValue
      });
    }
  }

  revealAnswer ({ answer, question }) {
    document.getElementById('question').innerHTML = question;
    document.getElementById('answer').innerHTML = 'ANSWER: ' + answer;
    document.getElementById('pause').disabled = true;

    document.getElementById('buzz').disabled = true;
    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('next').disabled = false;
    document.getElementById('next').textContent = 'Next';
    document.getElementById('start').disabled = false;

    document.getElementById('toggle-correct').classList.remove('d-none');
    document.getElementById('toggle-correct').textContent = this.room.previous.isCorrect ? 'I was wrong' : 'I was right';
  }

  setCategories ({ alternateSubcategories, categories, subcategories, percentView, categoryPercents }) {
    this.room.categoryManager.loadCategoryModal();
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setDifficulties ({ difficulties }) {
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setStrictness ({ strictness }) {
    document.getElementById('set-strictness').value = strictness;
    document.getElementById('strictness-display').textContent = strictness;
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  setPacketNumbers ({ packetNumbers }) {
    document.getElementById('packet-number').value = arrayToRange(packetNumbers);
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setReadingSpeed ({ readingSpeed }) {
    super.setReadingSpeed({ readingSpeed });
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  async setSetName ({ setName, setLength }) {
    document.getElementById('set-name').value = setName;
    // make border red if set name is not in set list
    const valid = !setName || api.getSetList().includes(setName);
    document.getElementById('set-name').classList.toggle('is-invalid', !valid);
    document.getElementById('packet-number').placeholder = 'Packet Numbers' + (setLength ? ` (1-${setLength})` : '');
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  setYearRange ({ minYear, maxYear }) {
    $('#slider').slider('values', [minYear, maxYear]);
    document.getElementById('year-range-a').textContent = minYear;
    document.getElementById('year-range-b').textContent = maxYear;
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleAiMode ({ aiMode }) {
    if (aiMode) { upsertPlayerItem(this.aiBot.player); }

    this.aiBot.active = aiMode;
    document.getElementById('ai-settings').disabled = !aiMode;
    document.getElementById('toggle-ai-mode').checked = aiMode;
    document.getElementById('player-list-group').classList.toggle('d-none', !aiMode);
    document.getElementById('player-list-group-hr').classList.toggle('d-none', !aiMode);
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  toggleCorrect ({ correct, userId }) {
    this.updateStatDisplay(this.room.players[this.USER_ID]);
    document.getElementById('toggle-correct').textContent = correct ? 'I was wrong' : 'I was right';
  }

  togglePowermarkOnly ({ powermarkOnly }) {
    super.togglePowermarkOnly({ powermarkOnly });
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleRebuzz ({ rebuzz }) {
    super.toggleRebuzz({ rebuzz });
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  setMode ({ mode }) {
    switch (mode) {
      case MODE_ENUM.SET_NAME:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        document.getElementById('toggle-powermark-only').disabled = true;
        document.getElementById('toggle-standard-only').disabled = true;
        break;
      case MODE_ENUM.RANDOM:
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('local-packet-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-powermark-only').disabled = false;
        document.getElementById('toggle-standard-only').disabled = false;
        break;
      case MODE_ENUM.STARRED:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-powermark-only').disabled = true;
        document.getElementById('toggle-standard-only').disabled = true;
        break;
      case MODE_ENUM.LOCAL:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-powermark-only').disabled = true;
        document.getElementById('toggle-standard-only').disabled = true;
        break;
    }
    document.getElementById('set-mode').value = mode;
    window.localStorage.setItem('singleplayer-tossup-mode', JSON.stringify({ mode, version: modeVersion }));
  }

  toggleShowHistory ({ showHistory }) {
    document.getElementById('room-history').classList.toggle('d-none', !showHistory);
    document.getElementById('toggle-show-history').checked = showHistory;
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  toggleStandardOnly ({ standardOnly }) {
    document.getElementById('toggle-standard-only').checked = standardOnly;
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...this.room.query, version: queryVersion }));
  }

  toggleTimer ({ timer }) {
    document.getElementById('timer').classList.toggle('d-none', !timer);
    document.getElementById('toggle-timer').checked = timer;
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  toggleTypeToAnswer ({ typeToAnswer }) {
    document.getElementById('type-to-answer').checked = typeToAnswer;
    window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...this.room.settings, version: settingsVersion }));
  }

  updateQuestion ({ word }) {
    if (word === '(*)' || word === '[*]') { return; }
    document.getElementById('question').innerHTML += word + ' ';
  }

  /**
 * Updates the displayed stat line.
 */
  updateStatDisplay ({ powers, tens, negs, tuh, points, celerity }) {
    const averageCelerity = celerity.correct.average.toFixed(3);
    const plural = (tuh === 1) ? '' : 's';
    document.getElementById('statline').innerHTML = `${powers}/${tens}/${negs} with ${tuh} tossup${plural} seen (${points} pts, celerity: ${averageCelerity})`;

    // disable clear stats button if no stats
    document.getElementById('clear-stats').disabled = (tuh === 0);
  }

  updateTimerDisplay (time) {
    const seconds = Math.floor(time / 10);
    const tenths = time % 10;
    document.querySelector('.timer .face').textContent = seconds;
    document.querySelector('.timer .fraction').textContent = '.' + tenths;
  }
}
