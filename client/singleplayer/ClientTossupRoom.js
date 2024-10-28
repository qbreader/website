import api from '../scripts/api/index.js';
import TossupRoom from '../../quizbowl/TossupRoom.js';

export default class ClientTossupRoom extends TossupRoom {
  constructor (name, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name, categories, subcategories, alternateSubcategories);

    this.previous = {
      celerity: 0,
      endOfQuestion: false,
      isCorrect: true,
      inPower: false,
      negValue: -5,
      powerValue: 15,
      tossup: {}
    };
    this.settings = {
      ...this.settings,
      skip: true,
      showHistory: true,
      typeToAnswer: true
    };

    this.checkAnswer = api.checkAnswer;
    this.getRandomTossups = async (args) => await api.getRandomTossup({ ...args });
    this.getSet = async ({ setName, packetNumbers }) => setName ? await api.getPacketTossups(setName, packetNumbers[0] ?? 1) : [];
    this.getSetList = api.getSetList;
    this.getNumPackets = api.getNumPackets;

    this.setList = this.getSetList();
  }

  async message (userId, message) {
    switch (message.type) {
      case 'toggle-correct': return this.toggleCorrect(userId, message);
      case 'toggle-show-history': return this.toggleShowHistory(userId, message);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(userId, message);
      default: super.message(userId, message);
    }
  }

  buzz (userId) {
    if (!this.settings.typeToAnswer && this.buzzes.includes(userId)) {
      this.giveAnswer(userId, { givenAnswer: this.tossup.answer_sanitized });
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

  async scoreTossup ({ givenAnswer }) {
    const { celerity, directive, directedPrompt, endOfQuestion, inPower, points } = await super.scoreTossup({ givenAnswer });
    this.previous.celerity = celerity;
    this.previous.endOfQuestion = endOfQuestion;
    this.previous.isCorrect = points > 0;
    this.previous.inPower = inPower;
    this.previous.tossup = this.tossup;
    return { celerity, directive, directedPrompt, points };
  }

  toggleCorrect (userId, { correct }) {
    const multiplier = correct ? 1 : -1;

    if (this.previous.inPower) {
      this.players[userId].powers += multiplier * 1;
      this.players[userId].points += multiplier * this.previous.powerValue;
    } else {
      this.players[userId].tens += multiplier * 1;
      this.players[userId].points += multiplier * 10;
    }

    if (this.previous.endOfQuestion) {
      this.players[userId].dead += multiplier * -1;
    } else {
      this.players[userId].negs += multiplier * -1;
      this.players[userId].points += multiplier * -this.previous.negValue;
    }

    this.players[userId].celerity.correct.total += multiplier * this.previous.celerity;
    this.players[userId].celerity.correct.average = this.players[userId].celerity.correct.total / (this.players[userId].powers + this.players[userId].tens);

    this.emitMessage({ type: 'toggle-correct', correct, userId });
  }

  toggleShowHistory (userId, { showHistory }) {
    this.settings.showHistory = showHistory;
    this.emitMessage({ type: 'toggle-show-history', showHistory, userId });
  }

  toggleTypeToAnswer (userId, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, userId });
  }
}
