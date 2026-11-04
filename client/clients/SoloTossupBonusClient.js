import { MODE_ENUM } from '../../shared/constants.js';
import { BONUS_ROOM_MESSAGE_TYPE } from '../../shared/protocol/bonus-room.js';
import questionStats from '../scripts/auth/question-stats.js';
import TossupBonusClient from './TossupBonusClient.js';

export const storage = Object.freeze({
  mode: { key: 'singleplayer-mode', version: '2026-10-18' },
  query: { key: 'singleplayer-query', version: '2026-10-18' },
  settings: { key: 'singleplayer-settings', version: '2026-10-18' }
});

function save ({ key, version }, value) {
  window.localStorage.setItem(key, JSON.stringify({ ...value, version }));
}

export default class SoloTossupBonusClient extends TossupBonusClient {
  constructor (room, userId, socket) {
    super(room, userId, socket);
    this.socket = socket;
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(data);
      default: return super.onmessage(message);
    }
  }

  buzz ({ userId }) {
    if (userId !== this.USER_ID) { return; }

    super.buzz({ userId });

    if (this.room.settings.typeToAnswer) {
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
    } else {
      document.getElementById('buzz').disabled = false;
      document.getElementById('buzz').textContent = 'Reveal';
    }
  }

  clearStats () {
    this.updateStatDisplay();
  }

  endCurrentBonus ({ bonus, lastPartRevealed, pointsPerPart, starred }) {
    super.endCurrentBonus({ bonus, starred });
    this.updateStatDisplay();
    if (lastPartRevealed && (this.room.mode !== MODE_ENUM.LOCAL)) {
      questionStats.recordBonus({ _id: bonus._id, pointsPerPart, multiplayer: false });
    }
  }

  endCurrentTossup ({ isSkip, starred, tossup }) {
    super.endCurrentTossup({ starred, tossup });

    // previousTossup is only about this tossup if the player buzzed on it
    const previous = this.room.previousTossup;
    const buzzedOnThisTossup = previous.userId === this.USER_ID && previous.tossup._id === tossup._id;
    if (!isSkip && buzzedOnThisTossup && (this.room.mode !== MODE_ENUM.LOCAL)) {
      const pointValue = previous.isCorrect
        ? (previous.inSuperpower ? previous.superpowerValue : (previous.inPower ? previous.powerValue : 10))
        : (previous.endOfQuestion ? 0 : previous.negValue);
      questionStats.recordTossup({
        _id: previous.tossup._id,
        celerity: previous.celerity,
        isCorrect: previous.isCorrect,
        multiplayer: false,
        pointValue
      });
    }
  }

  giveTossupAnswer ({ directive, directedPrompt, score, userId }) {
    super.giveTossupAnswer({ directive, directedPrompt, score, userId });

    if (directive === 'prompt') { return; }

    this.updateStatDisplay();

    if (this.room.settings.rebuzz && directive === 'reject') {
      document.getElementById('buzz').disabled = false;
      document.getElementById('buzz').textContent = 'Buzz';
      document.getElementById('pause').disabled = false;
    }
  }

  revealNextPart ({ bonusEligibleTeamId, currentPartNumber, part, value }) {
    super.revealNextPart({ bonusEligibleTeamId, currentPartNumber, part, value });
    const socket = this.socket;
    document.getElementById(`checkbox-${currentPartNumber + 1}`).addEventListener('click', function () {
      socket.sendToServer({ type: BONUS_ROOM_MESSAGE_TYPE.TOGGLE_BONUS_PART, partNumber: currentPartNumber, correct: this.checked });
    });
  }

  revealTossupAnswer ({ answer, question }) {
    super.revealTossupAnswer({ answer, question });

    document.getElementById('buzz').disabled = true;
    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('next').disabled = false;
    document.getElementById('next').textContent = 'Next';

    // there is nothing to overrule if the player never buzzed on this tossup
    const previous = this.room.previousTossup;
    if (previous.tossup._id !== this.room.tossup._id) { return; }
    document.getElementById('toggle-correct').classList.remove('d-none');
    document.getElementById('toggle-correct').textContent = previous.isCorrect ? 'I was wrong' : 'I was right';
  }

  setCategories () {
    super.setCategories();
    this.saveQuery();
  }

  setDifficulties () {
    this.saveQuery();
  }

  setMaxYear ({ maxYear }) {
    super.setMaxYear({ maxYear });
    this.saveQuery();
  }

  setMinYear ({ minYear }) {
    super.setMinYear({ minYear });
    this.saveQuery();
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
        this.disableQueryToggles();
        break;
      case MODE_ENUM.LOCAL:
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('local-packet-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        this.disableQueryToggles();
        break;
    }
    super.setMode({ mode });
    save(storage.mode, { mode });
  }

  setPacketNumbers ({ packetNumbers }) {
    super.setPacketNumbers({ packetNumbers });
    this.saveQuery();
  }

  setReadingSpeed ({ readingSpeed }) {
    super.setReadingSpeed({ readingSpeed });
    this.saveSettings();
  }

  setSetName ({ setName, setLength }) {
    super.setSetName({ setName, setLength });
    this.saveQuery();
  }

  startNextBonus ({ bonus, packetLength }) {
    super.startNextBonus({ bonus, packetLength });
    this.resetAnswerInput();
    document.getElementById('buzz').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('toggle-correct').classList.add('d-none');
    document.getElementById('next').disabled = false;
  }

  startNextTossup ({ packetLength, tossup }) {
    super.startNextTossup({ tossup, packetLength });
    this.resetAnswerInput();
    document.getElementById('next').disabled = false;
    document.getElementById('toggle-correct').textContent = 'I was wrong';
    document.getElementById('toggle-correct').classList.add('d-none');
    document.getElementById('next').textContent = 'Skip';
  }

  toggleCorrect ({ correct }) {
    this.updateStatDisplay();
    document.getElementById('toggle-correct').textContent = correct ? 'I was wrong' : 'I was right';
  }

  toggleEnableBonuses ({ enableBonuses }) {
    super.toggleEnableBonuses({ enableBonuses });
    this.saveSettings();
  }

  togglePowermarkOnly ({ powermarkOnly }) {
    super.togglePowermarkOnly({ powermarkOnly });
    this.saveQuery();
  }

  toggleReadBonusesLikeTossups ({ readBonusLikeATossup }) {
    // the reading speed slider is always visible here, so skip the parent's show/hide of it
    document.getElementById('toggle-read-bonuses-like-tossups').checked = readBonusLikeATossup;
    this.saveSettings();
  }

  toggleRebuzz ({ rebuzz }) {
    super.toggleRebuzz({ rebuzz });
    this.saveSettings();
  }

  toggleStandardOnly ({ standardOnly }) {
    super.toggleStandardOnly({ standardOnly });
    this.saveQuery();
  }

  toggleStopOnPower ({ stopOnPower }) {
    super.toggleStopOnPower({ stopOnPower });
    this.saveSettings();
  }

  toggleThreePartBonuses ({ threePartBonuses }) {
    super.toggleThreePartBonuses({ threePartBonuses });
    this.saveQuery();
  }

  toggleTimer ({ timer }) {
    super.toggleTimer({ timer });
    this.saveSettings();
  }

  toggleTypeToAnswer ({ typeToAnswer }) {
    document.getElementById('type-to-answer').checked = typeToAnswer;
    this.saveSettings();
  }

  /**
   * Renders both stat lines from the room state: tossups for the player, bonuses for their team.
   */
  updateStatDisplay () {
    const { superpowers, powers, tens, negs, tuh, points, celerity } = this.room.players[this.USER_ID];
    const averageCelerity = celerity.correct.average.toFixed(3);
    const plural = (tuh === 1) ? '' : 's';
    const statPrefix = superpowers > 0 ? `${superpowers}/${powers}/${tens}/${negs}` : `${powers}/${tens}/${negs}`;
    document.getElementById('statline').textContent = `${statPrefix} with ${tuh} tossup${plural} seen (${points} pts, celerity: ${averageCelerity})`;

    const stats = this.room.teams[this.room.players[this.USER_ID].teamId].bonusStats;
    const numBonuses = stats[0] + stats[10] + stats[20] + stats[30];
    const bonusPoints = 30 * stats[30] + 20 * stats[20] + 10 * stats[10];
    const ppb = Math.round(100 * bonusPoints / numBonuses) / 100 || 0;
    const includePlural = (numBonuses === 1) ? '' : 'es';
    document.getElementById('bonus-statline').textContent = `${ppb} PPB with ${numBonuses} bonus${includePlural} seen (${stats[30]}/${stats[20]}/${stats[10]}/${stats[0]}, ${bonusPoints} pts)`;

    // disable clear stats button if no stats
    document.getElementById('clear-stats').disabled = (tuh === 0 && numBonuses === 0);
  }

  /**
   * Starred and local questions ignore the filters that only apply to database queries.
   */
  disableQueryToggles () {
    document.getElementById('toggle-powermark-only').disabled = true;
    document.getElementById('toggle-standard-only').disabled = true;
    document.getElementById('toggle-three-part-bonuses').disabled = true;
  }

  resetAnswerInput () {
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input-group').classList.add('d-none');
  }

  saveQuery () {
    save(storage.query, this.room.query);
  }

  saveSettings () {
    save(storage.settings, this.room.settings);
  }
}
