import { ANSWER_TIME_LIMIT, DEAD_TIME_LIMIT, MODE_ENUM, TOSSUP_PROGRESS_ENUM } from './constants.js';
import insertTokensIntoHTML from './insert-tokens-into-html.js';
import QuestionRoom from './QuestionRoom.js';
import { CLIENT_MESSAGE_TYPE } from './protocol/room.js';
import { QUESTION_ROOM_MESSAGE_TYPE } from './protocol/question-room.js';
import { TOSSUP_CLIENT_MESSAGE_TYPE, TOSSUP_ROOM_MESSAGE_TYPE } from './protocol/tossup-room.js';

/**
 * @template {typeof QuestionRoom} TBase
 * @param {TBase} QuestionRoomClass
 */
export const TossupRoomMixin = (QuestionRoomClass) => class extends QuestionRoomClass {
  constructor (name, categoryManager, supportedQuestionTypes = ['tossup']) {
    super(name, categoryManager, supportedQuestionTypes);

    this.timeoutID = null;
    /**
     * @type {string | null}
     * The userId of the player who buzzed in.
     * We should ensure that buzzedIn is null before calling readTossup.
     */
    this.buzzedIn = null;
    this.buzzes = [];
    this.buzzpointIndices = [];
    this.liveAnswer = '';
    this.paused = false;
    this.questionSplit = [];
    this.tossup = {};
    this.stopOnPowerEnded = false;
    this.tossupProgress = TOSSUP_PROGRESS_ENUM.NOT_STARTED;
    this.wordIndex = 0;

    this.query = {
      ...this.query,
      powermarkOnly: false
    };

    this.settings = {
      ...this.settings,
      rebuzz: false,
      stopOnPower: false,
      readingSpeed: 50
    };

    this.previousTossup = {
      celerity: 0,
      endOfQuestion: false,
      isCorrect: true,
      inPower: false,
      inSuperpower: false,
      negValue: -5,
      powerValue: 15,
      superpowerValue: 20,
      tossup: {},
      userId: null
    };
  }

  /**
   * @param {{userId: string, username: string}} player
   */
  async message ({ userId, username }, message) {
    switch (message.type) {
      case TOSSUP_ROOM_MESSAGE_TYPE.BUZZ: return this.buzz({ userId, username }, message);
      case QUESTION_ROOM_MESSAGE_TYPE.GIVE_ANSWER: return this.giveTossupAnswer({ userId, username }, message);
      case QUESTION_ROOM_MESSAGE_TYPE.NEXT: return this.next({ userId, username }, message);
      case TOSSUP_ROOM_MESSAGE_TYPE.PAUSE: return this.pause({ userId, username }, message);
      case TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_POWERMARK_ONLY: return this.togglePowermarkOnly({ userId, username }, message);
      case TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_REBUZZ: return this.toggleRebuzz({ userId, username }, message);
      case TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_STOP_ON_POWER: return this.toggleStopOnPower({ userId, username }, message);
      case 'toggle-correct': return this.toggleCorrect({ userId, username }, message);
      default: return super.message({ userId, username }, message);
    }
  }

  buzz ({ userId, username }) {
    if (!this.settings.rebuzz && this.buzzes.includes(userId)) { return; }
    if (this.tossupProgress !== TOSSUP_PROGRESS_ENUM.READING) { return; }

    if (this.buzzedIn) {
      return this.emitMessage({ type: TOSSUP_CLIENT_MESSAGE_TYPE.LOST_BUZZER_RACE, userId, username });
    }

    clearTimeout(this.timeoutID);
    this.buzzedIn = userId;
    this.buzzes.push(userId);
    this.players[userId].buzzes++;
    this.buzzpointIndices.push(this.questionSplit.slice(0, this.wordIndex).join(' ').length);
    this.paused = false;

    this.emitMessage({ type: TOSSUP_ROOM_MESSAGE_TYPE.BUZZ, userId, username });
    this.emitMessage({ type: TOSSUP_CLIENT_MESSAGE_TYPE.UPDATE_QUESTION, word: '(#)' });

    this.startServerTimer(
      ANSWER_TIME_LIMIT * 10,
      (time) => this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: time }),
      () => this.giveTossupAnswer({ userId, username }, { givenAnswer: this.liveAnswer })
    );
  }

  endCurrentTossup ({ userId, username }) {
    if (this.buzzedIn) { return false; } // prevents skipping when someone has buzzed in
    if (this.queryingQuestion) { return false; }
    const isSkip = this.tossupProgress === TOSSUP_PROGRESS_ENUM.READING;
    if (isSkip && !this.settings.skip) { return false; }

    clearInterval(this.timer.interval);
    clearTimeout(this.timeoutID);
    this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: 0 });

    this.buzzedIn = null;
    this.buzzes = [];
    this.buzzpointIndices = [];
    this.paused = false;

    if (this.tossupProgress !== TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED) { this.revealTossupAnswer(); }

    const starred = this.mode === MODE_ENUM.STARRED ? true : (this.mode === MODE_ENUM.LOCAL ? false : null);
    this.emitMessage({ type: TOSSUP_CLIENT_MESSAGE_TYPE.END_CURRENT_TOSSUP, isSkip, starred, tossup: this.tossup });
    return true;
  }

  giveTossupAnswer ({ userId, username }, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }
    if (this.buzzedIn !== userId) { return false; }

    this.liveAnswer = '';
    clearInterval(this.timer.interval);
    this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: ANSWER_TIME_LIMIT * 10 });

    if (Object.keys(this.tossup || {}).length === 0) { return; }

    const { celerity, directive, directedPrompt, points } = this.scoreTossup({ givenAnswer });

    switch (directive) {
      case 'accept':
        this.buzzedIn = null;
        this.revealTossupAnswer();
        this.players[userId].updateStats(points, celerity);
        Object.values(this.players).forEach(player => { player.tuh++; });
        break;
      case 'reject':
        this.buzzedIn = null;
        this.players[userId].updateStats(points, celerity);
        if (!this.settings.rebuzz && Object.keys(this.sockets).every(id => this.buzzes.includes(id))) {
          this.revealTossupAnswer();
          Object.values(this.players).forEach(player => { player.tuh++; });
        } else {
          this.readTossup(Date.now());
        }
        break;
      case 'prompt':
        this.startServerTimer(
          ANSWER_TIME_LIMIT * 10,
          (time) => this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: time }),
          () => this.giveTossupAnswer({ userId, username }, { givenAnswer: this.liveAnswer })
        );
    }

    this.emitMessage({
      type: TOSSUP_CLIENT_MESSAGE_TYPE.GIVE_TOSSUP_ANSWER,
      userId,
      username,
      givenAnswer,
      directive,
      directedPrompt,
      score: points,
      celerity: this.players[userId].celerity.correct.average,
      // the below fields are used to record buzzpoint data
      tossup: this.tossup,
      perQuestionCelerity: celerity
    });
  }

  async next ({ userId, username }) {
    if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.NOT_STARTED) {
      return await this.startNextTossup({ userId, username });
    }
    const allowed = this.endCurrentTossup({ userId, username });
    if (allowed) { await this.startNextTossup({ userId, username }); }
  }

  pause ({ username }) {
    if (this.buzzedIn) { return false; }
    if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED) { return false; }

    this.paused = !this.paused;
    if (this.paused) {
      clearTimeout(this.timeoutID);
      clearInterval(this.timer.interval);
    } else if (this.wordIndex >= this.questionSplit.length) {
      this.startServerTimer(
        this.timer.timeRemaining,
        (time) => this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: time }),
        () => this.revealTossupAnswer()
      );
    } else {
      this.readTossup(Date.now());
    }
    this.emitMessage({ type: TOSSUP_ROOM_MESSAGE_TYPE.PAUSE, paused: this.paused, username });
  }

  async readTossup (expectedReadTime) {
    if (Object.keys(this.tossup || {}).length === 0) { return; }
    if (this.wordIndex >= this.questionSplit.length) {
      this.startServerTimer(
        DEAD_TIME_LIMIT * 10,
        (time) => this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: time }),
        () => this.revealTossupAnswer()
      );
      return;
    }

    const word = this.questionSplit[this.wordIndex];

    // stop reading and start timer if power and stopOnPower is enabled
    if ((word === '(*)' || word === '[*]') && this.settings.stopOnPower) {
      this.stopOnPowerEnded = true;
      this.startServerTimer(DEAD_TIME_LIMIT * 10,
        (time) => this.emitMessage({ type: CLIENT_MESSAGE_TYPE.TIMER_UPDATE, timeRemaining: time }),
        () => this.revealTossupAnswer()
      );
      return;
    }

    this.wordIndex++;
    this.emitMessage({ type: TOSSUP_CLIENT_MESSAGE_TYPE.UPDATE_QUESTION, word });

    // calculate time needed before reading next word
    let time = Math.log(word.length) + 1;
    if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123) ||
      word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d') {
      time += 2.5;
    } else if (word.endsWith(',') || word.slice(-2) === ',\u201d') {
      time += 1.5;
    } else if (word === '(*)' || word === '[*]' || word === '(+)') {
      time = 0;
    }

    time = time * 0.9 * (140 - this.settings.readingSpeed);
    const delay = time - Date.now() + expectedReadTime;

    this.timeoutID = setTimeout(() => {
      this.readTossup(time + expectedReadTime);
    }, delay);
  }

  revealTossupAnswer () {
    if (Object.keys(this.tossup || {}).length === 0) return;
    this.tossupProgress = TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED;
    this.tossup.markedQuestion = insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, { ' (#) ': this.buzzpointIndices });
    this.emitMessage({
      type: TOSSUP_CLIENT_MESSAGE_TYPE.REVEAL_TOSSUP_ANSWER,
      question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, { ' (#) ': this.buzzpointIndices }),
      answer: this.tossup.answer
    });
  }

  scoreTossup ({ givenAnswer }) {
    const celerity = this.questionSplit.slice(this.wordIndex).join(' ').length / this.tossup.question.length;
    const endOfQuestion = this.settings.stopOnPower ? this.stopOnPowerEnded : (this.wordIndex === this.questionSplit.length);
    const superpowerIndex = this.questionSplit.indexOf('(+)');
    const powerIndex = Math.max(this.questionSplit.indexOf('(*)'), this.questionSplit.indexOf('[*]'));
    const inSuperpower = superpowerIndex !== -1 && superpowerIndex >= this.wordIndex;
    const inPower = !inSuperpower && powerIndex !== -1 && powerIndex >= this.wordIndex;
    const { directive, directedPrompt } = this.checkAnswer(this.tossup.answer, givenAnswer, this.settings.strictness);
    const isCorrect = directive === 'accept';
    const points = isCorrect
      ? (inSuperpower ? this.previousTossup.superpowerValue : (inPower ? this.previousTossup.powerValue : 10))
      : (endOfQuestion ? 0 : this.previousTossup.negValue);

    this.previousTossup = {
      ...this.previousTossup,
      celerity,
      endOfQuestion,
      inPower,
      inSuperpower,
      isCorrect,
      tossup: this.tossup
    };

    if (this.buzzedIn) {
      this.previousTossup.userId = this.buzzedIn;
    }

    return { celerity, directive, directedPrompt, endOfQuestion, inPower, inSuperpower, points };
  }

  async startNextTossup ({ userId, username }) {
    this.tossup = await this.getNextQuestion('tossups');
    this.queryingQuestion = false;
    if (!this.tossup) { return; }
    this.emitMessage({ type: TOSSUP_CLIENT_MESSAGE_TYPE.START_NEXT_TOSSUP, packetLength: this.packet.tossups.length, tossup: this.tossup, userId, username });
    this.questionSplit = this.tossup.question_sanitized.split(' ').filter(word => word !== '');
    this.wordIndex = 0;
    this.tossupProgress = TOSSUP_PROGRESS_ENUM.READING;
    clearTimeout(this.timeoutID);
    this.readTossup(Date.now());
  }

  /**
   * @param {object} params
   * @param {boolean} params.correct whether the answer was correct. If `correct=true`, then the player's score increases after calling this function.
   * @param {string} params.targetUserId the ID of the user whose answer is being toggled.
   * @returns
   */
  toggleCorrect ({ userId, username }, { targetUserId }) {
    if (targetUserId !== this.previousTossup.userId) { return; }
    if (!this.players[targetUserId]) { return; }

    const correct = !this.previousTossup.isCorrect;
    this.previousTossup.isCorrect = correct;
    const multiplier = correct ? 1 : -1;

    if (this.previousTossup.inSuperpower) {
      this.players[targetUserId].superpowers += multiplier * 1;
      this.players[targetUserId].points += multiplier * this.previousTossup.superpowerValue;
    } else if (this.previousTossup.inPower) {
      this.players[targetUserId].powers += multiplier * 1;
      this.players[targetUserId].points += multiplier * this.previousTossup.powerValue;
    } else {
      this.players[targetUserId].tens += multiplier * 1;
      this.players[targetUserId].points += multiplier * 10;
    }

    if (this.previousTossup.endOfQuestion) {
      this.players[targetUserId].dead += multiplier * -1;
    } else {
      this.players[targetUserId].negs += multiplier * -1;
      this.players[targetUserId].points += multiplier * -this.previousTossup.negValue;
    }

    const correctBuzzes = this.players[targetUserId].superpowers + this.players[targetUserId].powers + this.players[targetUserId].tens;
    this.players[targetUserId].celerity.correct.total += multiplier * this.previousTossup.celerity;
    this.players[targetUserId].celerity.correct.average = this.players[targetUserId].celerity.correct.total / correctBuzzes;

    this.emitMessage({ type: 'toggle-correct', correct, targetUserId, player: this.players[targetUserId] });
  }

  togglePowermarkOnly ({ username }, { powermarkOnly }) {
    this.query.powermarkOnly = powermarkOnly;
    this.adjustQuery(['powermarkOnly'], [powermarkOnly]);
    this.emitMessage({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_POWERMARK_ONLY, powermarkOnly, username });
  }

  toggleRebuzz ({ username }, { rebuzz }) {
    this.settings.rebuzz = rebuzz;
    this.emitMessage({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_REBUZZ, rebuzz, username });
  }

  toggleStopOnPower ({ username }, { stopOnPower }) {
    this.settings.stopOnPower = stopOnPower;
    this.emitMessage({ type: TOSSUP_ROOM_MESSAGE_TYPE.TOGGLE_STOP_ON_POWER, stopOnPower, username });
  }
};

const TossupRoom = TossupRoomMixin(QuestionRoom);
export default TossupRoom;
