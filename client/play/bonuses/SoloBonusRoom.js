import BonusRoom from '../../../quizbowl/BonusRoom.js';
import api from '../../scripts/api/index.js';

async function getPacket ({ setName, packetNumber }) {
  return { bonuses: setName ? await api.getPacketBonuses(setName, packetNumber ?? 1) : [] };
}

let starredBonusIds = null;
async function getRandomStarredBonus () {
  if (starredBonusIds === null) {
    starredBonusIds = await fetch('/auth/stars/bonus-ids')
      .then(response => {
        if (!response.ok) { return null; }
        return response.json();
      });

    if (starredBonusIds === null) { return null; }

    // random shuffle
    starredBonusIds.sort(() => Math.random() - 0.5);
  }

  if (starredBonusIds.length === 0) { return null; }

  const _id = starredBonusIds.pop();
  return await api.getBonus(_id);
}

export default class SoloBonusRoom extends BonusRoom {
  constructor (name, categoryManager) {
    super(name, categoryManager, ['bonuses']);

    this.checkAnswer = api.checkAnswer;
    this.getRandomBonuses = api.getRandomBonus;
    this.getPacket = getPacket;
    this.getStarredBonus = getRandomStarredBonus;
    this.getPacketCount = api.getNumPackets;

    this.settings = {
      ...this.settings,
      skip: true,
      showHistory: true,
      typeToAnswer: true
    };
  }

  async message (userId, message) {
    switch (message.type) {
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(userId, message);
      default: super.message(userId, message);
    }
  }

  get liveAnswer () {
    return document.getElementById('answer-input').value;
  }

  set liveAnswer (value) {
    document.getElementById('answer-input').value = value;
  }

  startBonusAnswer (teamId) {
    if (!this.settings.typeToAnswer) {
      this.giveBonusAnswer(teamId, { givenAnswer: this.bonus.answers_sanitized[this.currentPartNumber] });
      return;
    }

    super.startBonusAnswer(teamId);
  }

  toggleTypeToAnswer (teamId, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, teamId });
  }
}
