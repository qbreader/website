import { ANSWER_TIME_LIMIT } from './constants.js';
import QuestionRoom from './QuestionRoom.js';

export default class BonusRoom extends QuestionRoom {
  constructor (name, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name, categories, subcategories, alternateSubcategories);

    this.QuestionProgressEnum = Object.freeze({
      NOT_STARTED: 0,
      READING: 1,
      LAST_PART_REVEALED: 2
    });

    this.bonus = {};
    /**
     * 0-indexed variable that tracks current part of the bonus being read
     */
    this.currentPartNumber = -1;
    /**
     * tracks how well the team is doing on the bonus
     * @type {number[]}
     */
    this.pointsPerPart = [];
    this.queryingQuestion = false;

    this.query = {
      threePartBonuses: true,
      ...this.query
    };
  }

  async message (userId, message) {
    switch (message.type) {
      case 'clear-stats': return this.clearStats(userId, message);
      case 'give-answer': return this.giveAnswer(userId, message);
      case 'next':
      case 'skip':
      case 'start':
        return this.next(userId, message);
      case 'start-answer': return this.startAnswer(userId, message);
      case 'toggle-correct': return this.toggleCorrect(userId, message);
      case 'toggle-three-part-bonuses': return this.toggleThreePartBonuses(userId, message);
      default: return super.message(userId, message);
    }
  }

  clearStats (userId) {
    const teamId = this.players[userId].teamId;
    this.teams[teamId].clearStats();
    this.emitMessage({ type: 'clear-stats', userId });
  }

  getPartValue (partNumber = this.currentPartNumber) {
    return this.bonus?.values?.[this.currentPartNumber] ?? 10;
  }

  giveAnswer (userId, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }

    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: ANSWER_TIME_LIMIT * 10 });

    const { directive, directedPrompt } = this.checkAnswer(this.bonus.answers[this.currentPartNumber], givenAnswer);
    this.emitMessage({ type: 'give-answer', currentPartNumber: this.currentPartNumber, directive, directedPrompt });

    if (directive === 'prompt') {
      this.startServerTimer(
        ANSWER_TIME_LIMIT * 10,
        (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
        () => this.giveAnswer(userId, { givenAnswer: this.liveAnswer })
      );
    } else {
      this.pointsPerPart.push(directive === 'accept' ? this.getPartValue() : 0);
      this.revealNextAnswer();
      this.revealNextPart();
    }
  }

  async next (userId, { type }) {
    if (this.queryingQuestion) { return false; }
    if (this.questionProgress === this.QuestionProgressEnum.READING && !this.settings.skip) { return false; }

    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: 0 });

    const teamId = this.players[userId].teamId;

    if (type === 'next') {
      this.teams[teamId].updateStats(this.pointsPerPart.reduce((a, b) => a + b, 0));
    }

    const oldBonus = this.bonus;
    this.bonus = await this.advanceQuestion({ lastSeenQuestion: oldBonus });
    this.queryingQuestion = false;
    if (!this.bonus) { return; }

    this.emitMessage({
      type,
      bonus: this.bonus,
      lastPartRevealed: this.questionProgress === this.QuestionProgressEnum.LAST_PART_REVEALED,
      oldBonus,
      packetLength: this.packetLength,
      pointsPerPart: this.pointsPerPart,
      userId,
      stats: this.teams[teamId].bonusStats
    });

    this.currentPartNumber = -1;
    this.pointsPerPart = [];
    this.questionProgress = this.QuestionProgressEnum.READING;
    this.revealLeadin();
    this.revealNextPart();
  }

  revealLeadin () {
    this.emitMessage({ type: 'reveal-leadin', leadin: this.bonus.leadin });
  }

  revealNextAnswer () {
    const lastPartRevealed = this.currentPartNumber === this.bonus.parts.length - 1;
    if (lastPartRevealed) {
      this.questionProgress = this.QuestionProgressEnum.LAST_PART_REVEALED;
    }
    this.emitMessage({
      type: 'reveal-next-answer',
      answer: this.bonus.answers[this.currentPartNumber],
      currentPartNumber: this.currentPartNumber,
      lastPartRevealed
    });
  }

  revealNextPart () {
    if (this.questionProgress === this.QuestionProgressEnum.LAST_PART_REVEALED) { return; }

    this.currentPartNumber++;
    this.emitMessage({
      type: 'reveal-next-part',
      currentPartNumber: this.currentPartNumber,
      part: this.bonus.parts[this.currentPartNumber],
      value: this.getPartValue()
    });
  }

  startAnswer (userId) {
    this.emitMessage({ type: 'start-answer', userId });
    this.startServerTimer(
      ANSWER_TIME_LIMIT * 10,
      (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
      () => this.giveAnswer(userId, { givenAnswer: this.liveAnswer })
    );
  }

  toggleCorrect (userId, { partNumber, correct }) {
    if (typeof partNumber !== 'number') { return false; }
    if (partNumber < 0 || partNumber >= this.bonus.parts.length) { return false; }
    this.pointsPerPart[partNumber] = correct ? this.getPartValue(partNumber) : 0;
  }

  toggleThreePartBonuses (userId, { threePartBonuses }) {
    this.query.threePartBonuses = threePartBonuses;
    this.adjustQuery(['threePartBonuses'], [threePartBonuses]);
    this.emitMessage({ type: 'toggle-three-part-bonuses', threePartBonuses });
  }
}
