import api from '../scripts/api/index.js';
import TossupBonusRoom from '../../shared/rooms/TossupBonusRoom.js';
import { QUESTION_TYPE_ENUM } from '../../shared/constants.js';
import { TOSSUP_BONUS_ROOM_MESSAGE_TYPE } from '../../shared/protocol/tossup-bonus-room.js';

async function fetchShuffledIds (url) {
  const ids = await fetch(url)
    .then(response => {
      if (!response.ok) { return null; }
      return response.json();
    });

  // random shuffle
  ids?.sort(() => Math.random() - 0.5);
  return ids;
}

let starredTossupIds = null;
async function getStarredTossup () {
  if (starredTossupIds === null) {
    starredTossupIds = await fetchShuffledIds('/auth/stars/tossup-ids');
    if (starredTossupIds === null) { return null; }
  }

  if (starredTossupIds.length === 0) { return null; }
  return await api.getTossup(starredTossupIds.pop());
}

let starredBonusIds = null;
async function getStarredBonus () {
  if (starredBonusIds === null) {
    starredBonusIds = await fetchShuffledIds('/auth/stars/bonus-ids');
    if (starredBonusIds === null) { return null; }
  }

  if (starredBonusIds.length === 0) { return null; }
  return await api.getBonus(starredBonusIds.pop());
}

async function getPacket ({ setName, packetNumber }) {
  if (!setName) { return { tossups: [], bonuses: [] }; }
  const [tossups, bonuses] = await Promise.all([
    api.getPacketTossups(setName, packetNumber ?? 1),
    api.getPacketBonuses(setName, packetNumber ?? 1)
  ]);
  return { tossups, bonuses };
}

export default class SoloTossupBonusRoom extends TossupBonusRoom {
  checkAnswer = api.checkAnswer;
  getPacket = getPacket;
  getPacketCount = api.getNumPackets;
  getRandomBonuses = async (args) => await api.getRandomBonus({ ...args });
  getRandomTossups = async (args) => await api.getRandomTossup({ ...args });
  getStarredBonus = getStarredBonus;
  getStarredTossup = getStarredTossup;

  constructor (name, categoryManager) {
    super(name, categoryManager, ['tossups', 'bonuses']);

    this.settings = {
      ...this.settings,
      enableBonuses: true,
      skip: true,
      showHistory: true,
      typeToAnswer: true
    };
  }

  async message ({ userId, username }, message) {
    switch (message.type) {
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer({ userId, username }, message);
      default: return await super.message({ userId, username }, message);
    }
  }

  buzz ({ userId, username }) {
    if (!this.settings.typeToAnswer && this.buzzes.includes(userId)) {
      this.giveTossupAnswer({ userId, username }, { givenAnswer: this.tossup.answer_sanitized });
      return;
    }

    super.buzz({ userId, username });
  }

  get liveAnswer () {
    return document.getElementById('answer-input').value;
  }

  set liveAnswer (value) {
    document.getElementById('answer-input').value = value;
  }

  startBonusAnswer ({ userId, username }) {
    if (!this.canUserAnswerBonus({ userId, username })) { return false; }

    if (!this.settings.typeToAnswer) {
      this.giveBonusAnswer({ userId, username }, { givenAnswer: this.bonus.answers_sanitized[this.currentPartNumber] });
      return;
    }

    super.startBonusAnswer({ userId, username });
  }

  /**
   * Unlike multiplayer, the player can overrule the answer checker on a tossup,
   * so the bonus must follow the final verdict rather than the first one.
   */
  toggleCorrect ({ userId, username }, { targetUserId }) {
    if (this.currentQuestionType !== QUESTION_TYPE_ENUM.TOSSUP) { return; }
    // previousTossup is stale if the player never buzzed on the current tossup
    if (this.previousTossup.tossup?._id !== this.tossup?._id) { return; }
    const wasCorrect = this.previousTossup.isCorrect;
    super.toggleCorrect({ userId, username }, { targetUserId });
    if (this.previousTossup.isCorrect === wasCorrect) { return; }

    this.bonusEligibleTeamId = this.previousTossup.isCorrect ? this.players[targetUserId].teamId : null;
    this.emitMessage({ type: TOSSUP_BONUS_ROOM_MESSAGE_TYPE.SET_BONUS_ELIGIBLE_TEAM_ID, teamId: this.bonusEligibleTeamId });
  }

  toggleTypeToAnswer ({ userId, username }, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, userId, username });
  }
}
