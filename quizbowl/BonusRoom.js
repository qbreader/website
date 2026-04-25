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

    this.readingTimeoutID = null;
    this.bonusQuestionSplit = [];
    this.bonusWordIndex = 0;

    this.query = {
      threePartBonuses: true,
      ...this.query
    };

    this.settings = {
      ...this.settings,
      readBonusLikeATossup: false,
      readingSpeed: 50
    };
  }

  async message ({ userId, username }, message) {
    switch (message.type) {
      case 'give-answer': return this.giveBonusAnswer({ userId, username }, message);
      case 'next': return this.next({ userId, username }, message);
      case 'set-reading-speed': return this.setReadingSpeed({ userId, username }, message);
      case 'start-bonus-answer': return this.startBonusAnswer({ userId, username }, message);
      case 'toggle-bonus-part': return this.toggleBonusPart({ userId, username }, message);
      case 'toggle-read-bonus-like-a-tossup': return this.toggleReadBonusLikeATossup({ userId, username }, message);
      case 'toggle-three-part-bonuses': return this.toggleThreePartBonuses({ userId, username }, message);
      default: return super.message({ userId, username }, message);
    }
  }

  clearStats ({ userId, username }) {
    const teamId = this.players[userId].teamId;
    this.teams[teamId].clearStats();
    super.clearStats({ userId, username });
  }

  endCurrentBonus ({ userId }) {
    if (this.queryingQuestion) { return false; }
    if (this.bonusProgress === BONUS_PROGRESS_ENUM.READING && !this.settings.skip) { return false; }

    clearTimeout(this.readingTimeoutID);
    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: 0 });

    const lastPartRevealed = this.bonusProgress === BONUS_PROGRESS_ENUM.LAST_PART_REVEALED;
    const pointsPerPart = this.pointsPerPart;
    const teamId = this.bonusEligibleTeamId ?? this.players[userId].teamId;
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

  giveBonusAnswer ({ userId, username }, { givenAnswer }) {
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
        () => this.giveBonusAnswer({ userId, username }, { givenAnswer: this.liveAnswer })
      );
    } else {
      this.pointsPerPart.push(directive === 'accept' ? this.getPartValue() : 0);
      this.revealNextAnswer();
      this.revealNextPart();
    }
  }

  async next ({ userId, username }) {
    if (this.bonusProgress === BONUS_PROGRESS_ENUM.NOT_STARTED) {
      return await this.startNextBonus({ userId, username });
    }
    const allowed = this.endCurrentBonus({ userId, username });
    if (allowed) { await this.startNextBonus({ userId, username }); }
  }

  revealLeadin () {
    if (this.settings.readBonusLikeATossup) {
      this.emitMessage({ type: 'reveal-leadin', leadin: '' });
      const leadinSanitized = this.bonus.leadin_sanitized ?? '';
      this.startReadingBonusText(leadinSanitized, () => {
        this.revealNextPart();
      });
    } else {
      this.emitMessage({ type: 'reveal-leadin', leadin: this.bonus.leadin });
    }
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

    if (this.settings.readBonusLikeATossup) {
      this.emitMessage({
        type: 'reveal-next-part',
        bonusEligibleTeamId: this.bonusEligibleTeamId,
        currentPartNumber: this.currentPartNumber,
        part: '',
        value: this.getPartValue()
      });
      const partSanitized = this.bonus.parts_sanitized?.[this.currentPartNumber] ?? '';
      this.startReadingBonusText(partSanitized, () => {
        this.autoStartBonusAnswer();
      });
    } else {
      this.emitMessage({
        type: 'reveal-next-part',
        bonusEligibleTeamId: this.bonusEligibleTeamId,
        currentPartNumber: this.currentPartNumber,
        part: this.bonus.parts[this.currentPartNumber],
        value: this.getPartValue()
      });
    }
  }

  startBonusAnswer ({ userId, username }) {
    this.emitMessage({ type: 'start-bonus-answer', userId });
    this.startServerTimer(
      ANSWER_TIME_LIMIT * 10,
      (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
      () => this.giveBonusAnswer({ userId, username }, { givenAnswer: this.liveAnswer })
    );
  }

  async startNextBonus ({ userId, username }) {
    this.bonus = await this.getNextQuestion('bonuses');
    this.queryingQuestion = false;
    if (!this.bonus) { return; }
    clearTimeout(this.readingTimeoutID);
    this.emitMessage({ type: 'start-next-bonus', packetLength: this.packet.bonuses.length, bonus: this.bonus, userId, username });
    this.currentPartNumber = -1;
    this.pointsPerPart = [];
    this.bonusProgress = BONUS_PROGRESS_ENUM.READING;
    this.revealLeadin();
    if (!this.settings.readBonusLikeATossup) {
      this.revealNextPart();
    }
  }

  toggleBonusPart ({ userId, username }, { partNumber, correct }) {
    if (typeof partNumber !== 'number') { return false; }
    if (partNumber < 0 || partNumber >= this.bonus.parts.length) { return false; }
    this.pointsPerPart[partNumber] = correct ? this.getPartValue(partNumber) : 0;
  }

  toggleThreePartBonuses ({ username }, { threePartBonuses }) {
    this.query.threePartBonuses = threePartBonuses;
    this.adjustQuery(['threePartBonuses'], [threePartBonuses]);
    this.emitMessage({ type: 'toggle-three-part-bonuses', threePartBonuses, username });
  }

  /**
   * Automatically starts the bonus answer after word-by-word reading is complete.
   * Finds the appropriate user to answer and calls startBonusAnswer.
   */
  autoStartBonusAnswer () {
    let userId, username;
    if (this.bonusEligibleTeamId) {
      const player = Object.values(this.players).find(p => p.teamId === this.bonusEligibleTeamId);
      userId = player?.userId;
      username = player?.username ?? '';
    }
    if (!userId) {
      userId = Object.keys(this.players)[0];
      username = userId ? (this.players[userId].username ?? '') : '';
    }
    if (!userId) { return; }
    this.startBonusAnswer({ userId, username });
  }

  /**
   * Splits sanitizedText into words and begins reading them word by word.
   * Calls onComplete when all words have been emitted.
   * @param {string} sanitizedText
   * @param {() => void} onComplete
   */
  startReadingBonusText (sanitizedText, onComplete) {
    this.bonusQuestionSplit = sanitizedText.split(' ').filter(word => word !== '');
    this.bonusWordIndex = 0;
    this.readBonusWord(Date.now(), onComplete);
  }

  /**
   * Reads the next word from bonusQuestionSplit, emitting it to all clients.
   * Schedules itself recursively until all words are read.
   * @param {number} expectedReadTime
   * @param {() => void} onComplete
   */
  readBonusWord (expectedReadTime, onComplete) {
    if (this.bonusWordIndex >= this.bonusQuestionSplit.length) {
      onComplete();
      return;
    }

    const word = this.bonusQuestionSplit[this.bonusWordIndex++];
    this.emitMessage({ type: 'update-bonus-question', word, currentPartNumber: this.currentPartNumber });

    let time = Math.log(word.length) + 1;
    if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123) ||
      word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d') {
      time += 2.5;
    } else if (word.endsWith(',') || word.slice(-2) === ',\u201d') {
      time += 1.5;
    }

    time = time * 0.9 * (140 - this.settings.readingSpeed);
    const delay = time - Date.now() + expectedReadTime;

    this.readingTimeoutID = setTimeout(() => {
      this.readBonusWord(time + expectedReadTime, onComplete);
    }, delay);
  }

  setReadingSpeed ({ username }, { readingSpeed }) {
    if (isNaN(readingSpeed)) { return false; }
    if (readingSpeed > 100) { readingSpeed = 100; }
    if (readingSpeed < 0) { readingSpeed = 0; }
    this.settings.readingSpeed = readingSpeed;
    this.emitMessage({ type: 'set-reading-speed', username, readingSpeed });
  }

  toggleReadBonusLikeATossup ({ username }, { readBonusLikeATossup }) {
    this.settings.readBonusLikeATossup = !!readBonusLikeATossup;
    this.emitMessage({ type: 'toggle-read-bonus-like-a-tossup', readBonusLikeATossup: this.settings.readBonusLikeATossup, username });
  }
};

const BonusRoom = BonusRoomMixin(QuestionRoom);
export default BonusRoom;
