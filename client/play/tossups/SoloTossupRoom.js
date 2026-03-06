import api from '../../scripts/api/index.js';
import TossupRoom from '../../../quizbowl/TossupRoom.js';

let starredTossupIds = null;
async function getStarredTossup () {
  if (starredTossupIds === null) {
    starredTossupIds = await fetch('/auth/stars/tossup-ids')
      .then(response => {
        if (!response.ok) { return null; }
        return response.json();
      });

    if (starredTossupIds === null) { return null; }

    // random shuffle
    starredTossupIds.sort(() => Math.random() - 0.5);
  }

  if (starredTossupIds.length === 0) { return null; }

  const _id = starredTossupIds.pop();
  return await api.getTossup(_id);
}

async function getPacket ({ setName, packetNumber }) {
  const tossups = setName ? await api.getPacketTossups(setName, packetNumber ?? 1) : [];
  return { tossups };
}

export default class SoloTossupRoom extends TossupRoom {
  constructor (name, categoryManager) {
    super(name, categoryManager, ['tossups']);

    this.settings = {
      ...this.settings,
      aiMode: false,
      skip: true,
      showHistory: true,
      typeToAnswer: true
    };

    this.checkAnswer = api.checkAnswer;
    this.getRandomTossups = async (args) => await api.getRandomTossup({ ...args });
    this.getPacket = getPacket;
    this.getStarredTossup = getStarredTossup;
    this.getPacketCount = api.getNumPackets;
  }

  async message (userId, message) {
    switch (message.type) {
      case 'toggle-ai-mode': return this.toggleAiMode(userId, message);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(userId, message);
      default: super.message(userId, message);
    }
  }

  buzz (userId) {
    if (!this.settings.typeToAnswer && this.buzzes.includes(userId)) {
      this.giveTossupAnswer(userId, { givenAnswer: this.tossup.answer_sanitized });
      return;
    }

    super.buzz(userId);
  }

  get liveAnswer () {
    return document.getElementById('answer-input').value;
  }

  set liveAnswer (value) {
    document.getElementById('answer-input').value = value;
  }

  toggleAiMode (userId, { aiMode }) {
    this.settings.aiMode = aiMode;
    this.emitMessage({ type: 'toggle-ai-mode', aiMode, userId });
  }

  toggleTypeToAnswer (userId, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, userId });
  }
}
