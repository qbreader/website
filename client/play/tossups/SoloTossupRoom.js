import api from '../../scripts/api/index.js';
import TossupRoom from '../../../shared/TossupRoom.js';

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
  checkAnswer = api.checkAnswer;
  getPacket = getPacket;
  getPacketCount = api.getNumPackets;
  getRandomTossups = async (args) => await api.getRandomTossup({ ...args });
  getStarredTossup = getStarredTossup;

  constructor (name, categoryManager) {
    super(name, categoryManager, ['tossups']);

    this.settings = {
      ...this.settings,
      aiMode: false,
      skip: true,
      showHistory: true,
      typeToAnswer: true
    };
  }

  async message ({ userId, username }, message) {
    switch (message.type) {
      case 'toggle-ai-mode': return this.toggleAiMode({ userId, username }, message);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer({ userId, username }, message);
      default: super.message({ userId, username }, message);
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

  toggleAiMode ({ userId, username }, { aiMode }) {
    this.settings.aiMode = aiMode;
    this.emitMessage({ type: 'toggle-ai-mode', aiMode, userId, username });
  }

  toggleTypeToAnswer ({ userId, username }, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, userId, username });
  }
}
