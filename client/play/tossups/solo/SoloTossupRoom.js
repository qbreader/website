import api from '../../../scripts/api/index.js';
import TossupRoom from '../../../../quizbowl/TossupRoom.js';

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

async function getPacket ({ setName, packetNumbers }) {
  const tossups = setName ? await api.getPacketTossups(setName, packetNumbers[0] ?? 1) : [];
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
    this.getRandomQuestions = async (args) => await api.getRandomTossup({ ...args });
    this.getPacket = getPacket;
    this.getStarredTossup = getStarredTossup;
    this.getPacketCount = api.getNumPackets;
  }

  async message (userId, message) {
    switch (message.type) {
      case 'toggle-ai-mode': return this.toggleAiMode(userId, message);
      case 'toggle-correct': return this.toggleCorrect(userId, message);
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

  /**
   * @param {object} params
   * @param {boolean} params.correct whether the answer was correct. If `correct=true`, then the player's score increases after calling this function.
   * @returns
   */
  toggleCorrect (userId, { correct }) {
    if (userId !== this.previousTossup.userId) { return; }

    this.previousTossup.isCorrect = correct;
    const multiplier = correct ? 1 : -1;

    if (this.previousTossup.inPower) {
      this.players[userId].powers += multiplier * 1;
      this.players[userId].points += multiplier * this.previousTossup.powerValue;
    } else {
      this.players[userId].tens += multiplier * 1;
      this.players[userId].points += multiplier * 10;
    }

    if (this.previousTossup.endOfQuestion) {
      this.players[userId].dead += multiplier * -1;
    } else {
      this.players[userId].negs += multiplier * -1;
      this.players[userId].points += multiplier * -this.previousTossup.negValue;
    }

    this.players[userId].celerity.correct.total += multiplier * this.previousTossup.celerity;
    this.players[userId].celerity.correct.average = this.players[userId].celerity.correct.total / (this.players[userId].powers + this.players[userId].tens);

    this.emitMessage({ type: 'toggle-correct', correct, userId });
  }

  toggleTypeToAnswer (userId, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, userId });
  }
}
