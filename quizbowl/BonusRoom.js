import { ANSWER_TIME_LIMIT, BONUS_PROGRESS_ENUM, MODE_ENUM } from './constants.js';
import QuestionRoom from './QuestionRoom.js';

export const BonusRoomMixin = (QuestionRoomClass) => class extends QuestionRoomClass {
  constructor (name, categoryManager, supportedQuestionTypes = ['bonuses']) {
    super(name, categoryManager, supportedQuestionTypes);

    this.bonus = {};
    this.bonusProgress = BONUS_PROGRESS_ENUM.NOT_STARTED;
    /**
     * 0-indexed variable that tracks current part of the bonus being read
     */
    this.currentPartNumber = -1;
    /**
     * tracks how well the team is doing on the bonus
     * @type {number[]}
     */
    this.pointsPerPart = [];

    this.query = {
      threePartBonuses: true,
      ...this.query
    };
  }

  async message (userId, message) {
    switch (message.type) {
      case 'give-answer': return this.giveBonusAnswer(userId, message);
      case 'next': return this.next(userId, message);
      case 'start-bonus-answer': return this.startBonusAnswer(userId, message);
      case 'toggle-bonus-part': return this.toggleBonusPart(userId, message);
      case 'toggle-three-part-bonuses': return this.toggleThreePartBonuses(userId, message);
      default: return super.message(userId, message);
    }
  }

  clearStats (userId) {
    const teamId = this.players[userId].teamId;
    this.teams[teamId].clearStats();
    super.clearStats(userId);
  }

  endCurrentBonus (userId) {
    if (this.queryingQuestion) { return false; }
    if (this.bonusProgress === BONUS_PROGRESS_ENUM.READING && !this.settings.skip) { return false; }

    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: 0 });

    const lastPartRevealed = this.bonusProgress === BONUS_PROGRESS_ENUM.LAST_PART_REVEALED;
    const pointsPerPart = this.pointsPerPart;
    const teamId = this.players[userId].teamId;
    if (lastPartRevealed) {
      this.teams[teamId].updateStats(this.pointsPerPart.reduce((a, b) => a + b, 0));
    }

    const stats = this.teams[teamId].bonusStats;
    const starred = this.mode === MODE_ENUM.STARRED ? true : (this.mode === MODE_ENUM.LOCAL ? false : null);
    this.emitMessage({ type: 'end-current-bonus', bonus: this.bonus, lastPartRevealed, pointsPerPart, starred, stats, teamId });
    return true;
  }

  getPartValue () {
    return this.bonus?.values?.[this.currentPartNumber] ?? 10;
  }

  giveBonusAnswer (userId, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }

    this.liveAnswer = '';
    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: ANSWER_TIME_LIMIT * 10 });

    const { directive, directedPrompt } = this.checkAnswer(this.bonus.answers[this.currentPartNumber], givenAnswer);
    this.emitMessage({ type: 'give-bonus-answer', currentPartNumber: this.currentPartNumber, directive, directedPrompt, givenAnswer, userId });

    if (directive === 'prompt') {
      this.startServerTimer(
        ANSWER_TIME_LIMIT * 10,
        (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
        () => this.giveBonusAnswer(userId, { givenAnswer: this.liveAnswer })
      );
    } else {
      this.pointsPerPart.push(directive === 'accept' ? this.getPartValue() : 0);
      this.revealNextAnswer();
      this.revealNextPart();
    }
  }

  async next (userId) {
    if (this.bonusProgress === BONUS_PROGRESS_ENUM.NOT_STARTED) {
      return await this.startNextBonus(userId);
    }
    const allowed = this.endCurrentBonus(userId);
    if (allowed) { await this.startNextBonus(userId); }
  }

  revealLeadin () {
    this.emitMessage({ type: 'reveal-leadin', leadin: this.bonus.leadin });
  }

  revealNextAnswer () {
    const lastPartRevealed = this.currentPartNumber === this.bonus.parts.length - 1;
    if (lastPartRevealed) {
      this.bonusProgress = BONUS_PROGRESS_ENUM.LAST_PART_REVEALED;
    }
    this.emitMessage({
      type: 'reveal-next-answer',
      answer: this.bonus.answers[this.currentPartNumber],
      currentPartNumber: this.currentPartNumber,
      lastPartRevealed
    });
  }

  revealNextPart () {
    if (this.bonusProgress === BONUS_PROGRESS_ENUM.LAST_PART_REVEALED) { return; }

    this.currentPartNumber++;
    this.emitMessage({
      type: 'reveal-next-part',
      bonusEligibleTeamId: this.bonusEligibleTeamId,
      currentPartNumber: this.currentPartNumber,
      part: this.bonus.parts[this.currentPartNumber],
      value: this.getPartValue()
    });
  }

  startBonusAnswer (userId) {
    this.emitMessage({ type: 'start-bonus-answer', userId });
    this.startServerTimer(
      ANSWER_TIME_LIMIT * 10,
      (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
      () => this.giveBonusAnswer(userId, { givenAnswer: this.liveAnswer })
    );
  }

  async startNextBonus (userId) {
    const username = this.players[userId].username;
    this.bonus = await this.getNextQuestion('bonuses');
    this.queryingQuestion = false;
    if (!this.bonus) { return; }
    this.emitMessage({ type: 'start-next-bonus', packetLength: this.packet.bonuses.length, bonus: this.bonus, userId, username });
    this.currentPartNumber = -1;
    this.pointsPerPart = [];
    this.bonusProgress = BONUS_PROGRESS_ENUM.READING;
    this.revealLeadin();
    this.revealNextPart();
  }

  toggleBonusPart (userId, { partNumber, correct }) {
    if (typeof partNumber !== 'number') { return false; }
    if (partNumber < 0 || partNumber >= this.bonus.parts.length) { return false; }
    this.pointsPerPart[partNumber] = correct ? this.getPartValue(partNumber) : 0;
  }

  toggleThreePartBonuses (userId, { threePartBonuses }) {
    const username = this.players[userId].username;
    this.query.threePartBonuses = threePartBonuses;
    this.adjustQuery(['threePartBonuses'], [threePartBonuses]);
    this.emitMessage({ type: 'toggle-three-part-bonuses', threePartBonuses, username });
  }
};

const BonusRoom = BonusRoomMixin(QuestionRoom);
export default BonusRoom;
