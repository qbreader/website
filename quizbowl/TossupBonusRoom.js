import { ANSWER_TIME_LIMIT, BONUS_PROGRESS_ENUM } from './constants.js';
import TossupRoom from './TossupRoom.js';

const ROUND = Object.freeze({
  TOSSUP: 0,
  BONUS: 1
});

export default class TossupBonusRoom extends TossupRoom {
  constructor (name, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name, categories, subcategories, alternateSubcategories);
    this.currentRound = ROUND.TOSSUP;
    this.useRandomQuestionCache = false;
  }

  switchToTossupRound () {
    this.currentRound = ROUND.TOSSUP;
    this.randomQuestionCache = [];
    this.bonusEligibleUserId = null;
    this.getNextLocalQuestion = super.getNextLocalQuestion;
    this.getRandomQuestions = this.getRandomTossups;
  }

  switchToBonusRound () {
    this.currentRound = ROUND.BONUS;
    this.randomQuestionCache = [];

    this.getNextLocalQuestion = () => {
      if (this.localQuestions.bonuses.length === 0) { return null; }
      if (this.settings.randomizeOrder) {
        const randomIndex = Math.floor(Math.random() * this.localQuestions.bonuses.length);
        return this.localQuestions.bonuses.splice(randomIndex, 1)[0];
      }
      return this.localQuestions.bonuses.shift();
    };
    this.getRandomQuestions = this.getRandomBonuses;

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

    /**
     * tracks the buzz timer (time limit to click "Reveal" before auto-buzzing)
     */
    this.buzzTimer = {
      interval: null,
      timeRemaining: 0
    };

    this.query = {
      bonusLength: 3,
      ...this.query
    };
  }

  async message (userId, message) {
    switch (message.type) {
      case 'give-answer': return this.giveAnswer(userId, message);
      case 'start-answer': return this.startAnswer(userId, message);
      default: return super.message(userId, message);
    }
  }

  scoreTossup ({ givenAnswer }) {
    const decision = super.scoreTossup({ givenAnswer });
    if (decision.directive === 'accept') {
      this.bonusEligibleUserId = this.buzzedIn;
      this.switchToBonusRound();
    }
    return decision;
  }

  async nextRound (userId, { type }) {
    if (this.currentRound === ROUND.TOSSUP) {
      await this.nextTossup(userId, { type });
    } else {
      await this.nextBonus(userId, { type });
    }
  }

  lastQuestionDict () {
    if (this.currentRound === ROUND.TOSSUP) {
      return { oldTossup: this.tossup };
    } else {
      return { oldBonus: this.bonus };
    }
  }

  async nextBonus (userId, { type }) {
    if (this.queryingQuestion) { return false; }
    if (this.bonusProgress === BONUS_PROGRESS_ENUM.READING && !this.settings.skip) { return false; }

    clearInterval(this.timer.interval);
    clearInterval(this.buzzTimer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: 0 });

    const bonusStarted = this.bonusProgress !== BONUS_PROGRESS_ENUM.NOT_STARTED;
    const lastPartRevealed = this.bonusProgress === BONUS_PROGRESS_ENUM.LAST_PART_REVEALED;
    const pointsPerPart = this.pointsPerPart;

    if (type === 'next' && bonusStarted) {
      // Points already added incrementally during bonus, just update stats with 0 points
      this.players[userId].updateStats(0, 1);
      const oldBonus = this.bonus; // Preserve oldBonus before switching rounds
      this.switchToTossupRound();
      await this.nextTossup(userId, { type, oldBonus });
    } else {
      const lastQuestionDict = this.lastQuestionDict();

      // If this is the first bonus (transitioning from tossup), preserve the oldTossup
      const preservedTossup = (!bonusStarted && this.currentRound === ROUND.BONUS)
        ? { oldTossup: this.tossup }
        : {};

      this.bonus = await this.advanceQuestion();
      this.queryingQuestion = false;

      if (!this.bonus) {
        this.emitMessage({ ...lastQuestionDict, ...preservedTossup, type: 'end', lastPartRevealed, pointsPerPart, userId });
        return false;
      }

      if (!this.bonus.parts || !Array.isArray(this.bonus.parts) || this.bonus.parts.length === 0) {
        console.error('Invalid bonus received - missing or empty parts array:', this.bonus);
        this.emitMessage({ ...lastQuestionDict, ...preservedTossup, type: 'end', lastPartRevealed, pointsPerPart, userId });
        return false;
      }

      this.emitMessage({ ...lastQuestionDict, ...preservedTossup, type, bonus: this.bonus, lastPartRevealed, packetLength: this.packetLength, pointsPerPart });

      this.currentPartNumber = -1;
      this.pointsPerPart = [];
      this.bonusProgress = BONUS_PROGRESS_ENUM.READING;
      this.revealLeadin();
      this.revealNextPart();
    }
  }

  giveAnswer (userId, { givenAnswer }) {
    if (this.currentRound === ROUND.TOSSUP) {
      return super.giveAnswer(userId, { givenAnswer });
    }

    // Only the user who answered the tossup correctly can answer the bonus
    if (userId !== this.bonusEligibleUserId) {
      return false;
    }

    if (typeof givenAnswer !== 'string') { return false; }

    this.liveAnswer = '';
    clearInterval(this.timer.interval);
    clearInterval(this.buzzTimer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: ANSWER_TIME_LIMIT * 10 });

    const { directive, directedPrompt } = this.checkAnswer(this.bonus.answers[this.currentPartNumber], givenAnswer);
    const points = directive === 'accept' ? this.getPartValue() : 0;
    this.emitMessage({
      type: 'give-answer',
      currentPartNumber: this.currentPartNumber,
      directive,
      directedPrompt,
      givenAnswer,
      score: points,
      userId,
      username: this.players[userId].username,
      bonus: this.bonus
    });

    if (directive === 'prompt') {
      this.startServerTimer(
        ANSWER_TIME_LIMIT * 10,
        (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
        () => this.giveAnswer(userId, { givenAnswer: this.liveAnswer })
      );
    } else {
      const partPoints = directive === 'accept' ? this.getPartValue() : 0;
      this.pointsPerPart.push(partPoints);
      // Immediately update player score on server so reconnection state is correct
      this.players[userId].points += partPoints;
      this.revealNextAnswer();
      this.revealNextPart();
    }
  }

  startAnswer (userId) {
    // Only the user who answered the tossup correctly can answer the bonus
    if (userId !== this.bonusEligibleUserId) {
      return false;
    }

    // Cancel buzz timer when manually revealing
    clearInterval(this.buzzTimer.interval);

    this.liveAnswer = ''; // Clear any previous answer
    this.emitMessage({ type: 'start-answer', userId: this.bonusEligibleUserId });
    this.startServerTimer(
      ANSWER_TIME_LIMIT * 10,
      (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time, timerType: 'answer' }),
      () => this.giveAnswer(userId, { givenAnswer: this.liveAnswer })
    );
  }

  startBuzzTimer (userId) {
    clearInterval(this.buzzTimer.interval);
    // Use 15 seconds for first part (includes leadin), 10 seconds for others
    const timeLimit = this.currentPartNumber === 0 ? 15 : ANSWER_TIME_LIMIT;
    this.buzzTimer.timeRemaining = timeLimit * 10;

    this.buzzTimer.interval = setInterval(() => {
      if (this.buzzTimer.timeRemaining <= 0) {
        clearInterval(this.buzzTimer.interval);
        // Auto-trigger startAnswer when timer expires
        this.startAnswer(userId);
        return;
      }
      this.emitMessage({
        type: 'timer-update',
        timeRemaining: this.buzzTimer.timeRemaining,
        timerType: 'buzz'
      });
      this.buzzTimer.timeRemaining--;
    }, 100);
  }

  getPartValue (partNumber = this.currentPartNumber) {
    return this.bonus?.values?.[this.currentPartNumber] ?? 10;
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
      currentPartNumber: this.currentPartNumber,
      part: this.bonus.parts[this.currentPartNumber],
      value: this.getPartValue(),
      bonusEligibleUserId: this.bonusEligibleUserId
    });

    // Start 10-second buzz timer - auto-reveals if not manually revealed
    this.startBuzzTimer(this.bonusEligibleUserId);
  }
}
