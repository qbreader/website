import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, CATEGORIES, SUBCATEGORIES_FLATTENED, ALTERNATE_SUBCATEGORIES_FLATTENED, SUBCATEGORY_TO_CATEGORY, ALTERNATE_SUBCATEGORY_TO_CATEGORY } from './constants.js';
import CategoryManager from './category-manager.js';
import insertTokensIntoHTML from './insert-tokens-into-html.js';
import Room from './Room.js';

/**
 * @returns {Number} The number of points scored on a tossup.
 */
function scoreTossup ({ isCorrect, inPower, endOfQuestion, isPace = false }) {
  const powerValue = isPace ? 20 : 15;
  const negValue = isPace ? 0 : -5;
  return isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);
}

export default class TossupRoom extends Room {
  constructor (name, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name);

    this.checkAnswer = async function checkAnswer (answerline, givenAnswer, strictness = 7) { throw new Error('Not implemented'); };
    this.getRandomTossups = async function getRandomTossups (args) { throw new Error('Not implemented'); };
    this.getSet = async function getSet (args) { throw new Error('Not implemented'); };
    this.getSetList = async function getSetList (args) { throw new Error('Not implemented'); };
    this.getNumPackets = async function getNumPackets (setName) { throw new Error('Not implemented'); };

    this.QuestionProgressEnum = Object.freeze({
      NOT_STARTED: 0,
      READING: 1,
      ANSWER_REVEALED: 2
    });

    this.timeoutID = null;
    /**
     * @type {string | null}
     * The userId of the player who buzzed in.
     * We should ensure that buzzedIn is null before calling any readQuestion.
     */
    this.buzzedIn = null;
    this.buzzes = [];
    this.buzzpointIndices = [];
    this.liveAnswer = '';
    this.packetLength = undefined;
    this.paused = false;
    this.queryingQuestion = false;
    this.questionProgress = this.QuestionProgressEnum.NOT_STARTED;
    this.questionSplit = [];
    this.tossup = {};
    this.wordIndex = 0;

    this.randomQuestionCache = [];
    this.setCache = [];

    this.query = {
      difficulties: [4, 5],
      minYear: DEFAULT_MIN_YEAR,
      maxYear: DEFAULT_MAX_YEAR,
      packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
      setName: '2023 PACE NSC',
      alternateSubcategories,
      categories,
      subcategories,
      reverse: true, // used for `database.getSet`
      powermarkOnly: false,
      selectBySetName: false,
      standardOnly: false
    };

    this.settings = {
      strictness: 7,
      rebuzz: false,
      readingSpeed: 50,
      skip: false,
      timer: true
    };

    this.DEAD_TIME_LIMIT = 5; // time to buzz after question is read
    this.ANSWER_TIME_LIMIT = 10; // time to give answer after buzzing
  }

  async message (userId, message) {
    switch (message.type) {
      case 'buzz': return this.buzz(userId, message);
      case 'clear-stats': return this.clearStats(userId, message);
      case 'give-answer': return this.giveAnswer(userId, message);

      case 'next':
      case 'skip':
      case 'start':
        return this.next(userId, message);

      case 'pause': return this.pause(userId, message);
      case 'set-categories': return this.setCategories(userId, message);
      case 'set-difficulties': return this.setDifficulties(userId, message);
      case 'set-strictness': return this.setStrictness(userId, message);
      case 'set-packet-numbers': return this.setPacketNumbers(userId, message);
      case 'set-reading-speed': return this.setReadingSpeed(userId, message);
      case 'set-set-name': return this.setSetName(userId, message);
      case 'set-username': return this.setUsername(userId, message);
      case 'set-year-range': return this.setYearRange(userId, message);
      case 'toggle-powermark-only': return this.togglePowermarkOnly(userId, message);
      case 'toggle-rebuzz': return this.toggleRebuzz(userId, message);
      case 'toggle-select-by-set-name': return this.toggleSelectBySetName(userId, message);
      case 'toggle-skip': return this.toggleSkip(userId, message);
      case 'toggle-standard-only': return this.toggleStandardOnly(userId, message);
      case 'toggle-timer': return this.toggleTimer(userId, message);
      case 'toggle-public': return this.togglePublic(userId, message);
    }
  }

  async adjustQuery (settings, values) {
    if (settings.length !== values.length) { return; }

    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i];
      const value = values[i];
      if (Object.prototype.hasOwnProperty.call(this.query, setting)) {
        this.query[setting] = value;
      }
    }

    if (this.query.selectBySetName) {
      this.setCache = await this.getSet({ setName: this.query.setName, packetNumbers: [this.query.packetNumbers[0]] });
      this.packetLength = this.setCache.length;
    } else {
      this.randomQuestionCache = await this.getRandomTossups({ ...this.query, number: 1 });
    }
  }

  async advanceQuestion () {
    this.queryingQuestion = true;

    if (this.query.selectBySetName) {
      const categoryManager = new CategoryManager(this.query.categories, this.query.subcategories, this.query.alternateSubcategories);
      do {
        if (this.setCache.length === 0) {
          const packetNumber = this.query.packetNumbers.shift();
          if (packetNumber === undefined) {
            this.emitMessage({ type: 'end-of-set' });
            return false;
          }
          this.setCache = await this.getSet({ setName: this.query.setName, packetNumbers: [packetNumber] });
          this.packetLength = this.setCache.length;
        }

        this.tossup = this.setCache.shift();
        this.query.packetNumbers = this.query.packetNumbers.filter(packetNumber => packetNumber >= this.tossup.packet.number);
      } while (!categoryManager.isValidCategory(this.tossup));
    } else {
      if (this.randomQuestionCache.length === 0) {
        this.randomQuestionCache = await this.getRandomTossups({ ...this.query, number: 20 });
        if (this.randomQuestionCache?.length === 0) {
          this.tossup = {};
          this.emitMessage({ type: 'no-questions-found' });
          return false;
        }
      }
      this.tossup = this.randomQuestionCache.pop();
    }

    this.questionSplit = this.tossup.question_sanitized.split(' ').filter(word => word !== '');
    return true;
  }

  buzz (userId) {
    if (!this.settings.rebuzz && this.buzzes.includes(userId)) { return; }

    const username = this.players[userId].username;
    if (this.buzzedIn) {
      this.emitMessage({ type: 'lost-buzzer-race', userId, username });
      return;
    }

    clearTimeout(this.timeoutID);
    this.buzzedIn = userId;
    this.buzzes.push(userId);
    this.buzzpointIndices.push(this.questionSplit.slice(0, this.wordIndex).join(' ').length);
    this.paused = false;

    this.emitMessage({ type: 'buzz', userId, username });
    this.emitMessage({ type: 'update-question', word: '(#)' });

    this.startServerTimer(
      this.ANSWER_TIME_LIMIT * 10,
      (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
      () => this.giveAnswer(userId, { givenAnswer: this.liveAnswer })
    );
  }

  clearStats (userId) {
    this.players[userId].clearStats();
    this.emitMessage({ type: 'clear-stats', userId });
  }

  setDifficulties (userId, { difficulties }) {
    const invalid = difficulties.some((value) => typeof value !== 'number' || isNaN(value) || value < 0 || value > 10);
    if (invalid) { return false; }

    const username = this.players[userId].username;
    this.adjustQuery(['difficulties'], [difficulties]);
    this.emitMessage({ type: 'set-difficulties', username, difficulties });
  }

  async giveAnswer (userId, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }
    if (this.buzzedIn !== userId) { return false; }

    this.liveAnswer = '';
    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: this.ANSWER_TIME_LIMIT * 10 });

    if (Object.keys(this.tossup).length === 0) { return; }

    const { celerity, directive, directedPrompt, points } = await this.scoreTossup({ givenAnswer });

    switch (directive) {
      case 'accept':
        this.buzzedIn = null;
        this.revealQuestion();
        this.players[userId].updateStats(points, celerity);
        Object.values(this.players).forEach(player => { player.tuh++; });
        break;
      case 'reject':
        this.buzzedIn = null;
        this.players[userId].updateStats(points, celerity);
        if (!this.settings.rebuzz && this.buzzes.length === Object.keys(this.sockets).length) {
          this.revealQuestion();
          Object.values(this.players).forEach(player => { player.tuh++; });
        } else {
          this.readQuestion(Date.now());
        }
        break;
      case 'prompt':
        this.startServerTimer(
          this.ANSWER_TIME_LIMIT * 10,
          (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
          () => this.giveAnswer(userId, { givenAnswer: this.liveAnswer })
        );
    }

    this.emitMessage({
      type: 'give-answer',
      userId,
      username: this.players[userId].username,
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

  leave (userId) {
    // this.deletePlayer(userId);
    this.players[userId].online = false;
    delete this.sockets[userId];
    const username = this.players[userId].username;
    this.emitMessage({ type: 'leave', userId, username });
  }

  /**
   * Logic for when the user presses the next button.
   * @param {string} userId - The userId of the user who pressed the next button.
   * @param {'next' | 'skip' | 'start'} type - The type of next button pressed.
   * @returns
   */
  async next (userId, { type }) {
    if (this.buzzedIn) { return false; } // prevents skipping when someone has buzzed in
    if (this.queryingQuestion) { return false; }
    if (this.questionProgress === this.QuestionProgressEnum.READING && !this.settings.skip) { return false; }

    clearTimeout(this.timeoutID);
    this.buzzedIn = null;
    this.buzzes = [];
    this.buzzpointIndices = [];
    this.paused = false;

    if (this.questionProgress !== this.QuestionProgressEnum.ANSWER_REVEALED) { this.revealQuestion(); }

    const oldTossup = this.tossup;
    const hasNextQuestion = await this.advanceQuestion();
    this.queryingQuestion = false;
    if (!hasNextQuestion) { return; }

    const username = this.players[userId].username;
    this.emitMessage({ type, packetLength: this.packetLength, userId, username, oldTossup, tossup: this.tossup });

    this.wordIndex = 0;
    this.questionProgress = this.QuestionProgressEnum.READING;
    this.readQuestion(Date.now());
  }

  pause (userId) {
    if (this.buzzedIn) { return false; }

    this.paused = !this.paused;
    if (this.paused) {
      clearTimeout(this.timeoutID);
      clearInterval(this.timer.interval);
    } else if (this.wordIndex >= this.questionSplit.length) {
      this.startServerTimer(
        this.timer.timeRemaining,
        (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
        () => this.revealQuestion()
      );
    } else {
      this.readQuestion(Date.now());
    }
    const username = this.players[userId].username;
    this.emitMessage({ type: 'pause', paused: this.paused, username });
  }

  async scoreTossup ({ givenAnswer }) {
    const celerity = this.questionSplit.slice(this.wordIndex).join(' ').length / this.tossup.question.length;
    const endOfQuestion = (this.wordIndex === this.questionSplit.length);
    const inPower = this.questionSplit.indexOf('(*)') >= this.wordIndex;
    const { directive, directedPrompt } = await this.checkAnswer(this.tossup.answer, givenAnswer, this.settings.strictness);
    const points = scoreTossup({ isCorrect: directive === 'accept', inPower, endOfQuestion });
    return { celerity, directive, directedPrompt, endOfQuestion, inPower, points };
  }

  setStrictness (userId, { strictness }) {
    this.settings.strictness = strictness;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-strictness', username, strictness });
  }

  async setPacketNumbers (userId, { packetNumbers }) {
    if (!Array.isArray(packetNumbers)) { return false; }
    const allowedPacketNumbers = await this.getNumPackets(this.query.setName);
    if (packetNumbers.some((value) => typeof value !== 'number' || value < 1 || value > allowedPacketNumbers)) { return false; }

    const username = this.players[userId].username;
    this.adjustQuery(['packetNumbers'], [packetNumbers]);
    this.emitMessage({ type: 'set-packet-numbers', username, packetNumbers });
  }

  setReadingSpeed (userId, { readingSpeed }) {
    if (isNaN(readingSpeed)) { return false; }
    if (readingSpeed > 100) { readingSpeed = 100; }
    if (readingSpeed < 0) { readingSpeed = 0; }

    this.settings.readingSpeed = readingSpeed;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-reading-speed', username, readingSpeed });
  }

  async setSetName (userId, { packetNumbers, setName }) {
    if (typeof setName !== 'string') { return; }
    const username = this.players[userId].username;
    this.adjustQuery(['setName', 'packetNumbers'], [setName, packetNumbers]);
    this.emitMessage({ type: 'set-set-name', username, setName });
  }

  setUsername (userId, { username }) {
    if (typeof username !== 'string') { return false; }
    const oldUsername = this.players[userId].username;
    this.players[userId].username = username;
    this.emitMessage({ type: 'set-username', userId, oldUsername, newUsername: username });
  }

  startServerTimer (time, ontick, callback) {
    if (!this.settings.timer) { return; }
    super.startServerTimer(time, ontick, callback);
  }

  async readQuestion (expectedReadTime) {
    if (Object.keys(this.tossup).length === 0) { return; }
    if (this.wordIndex >= this.questionSplit.length) {
      this.startServerTimer(
        this.DEAD_TIME_LIMIT * 10,
        (time) => this.emitMessage({ type: 'timer-update', timeRemaining: time }),
        () => this.revealQuestion()
      );
      return;
    }

    const word = this.questionSplit[this.wordIndex];
    this.wordIndex++;
    this.emitMessage({ type: 'update-question', word });

    // calculate time needed before reading next word
    let time = Math.log(word.length) + 1;
    if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123) ||
            word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d') {
      time += 2;
    } else if (word.endsWith(',') || word.slice(-2) === ',\u201d') {
      time += 0.75;
    } else if (word === '(*)') {
      time = 0;
    }

    time = time * 0.9 * (125 - this.settings.readingSpeed);
    const delay = time - Date.now() + expectedReadTime;

    this.timeoutID = setTimeout(() => {
      this.readQuestion(time + expectedReadTime);
    }, delay);
  }

  revealQuestion () {
    if (Object.keys(this.tossup).length === 0) return;

    this.questionProgress = this.QuestionProgressEnum.ANSWER_REVEALED;
    this.emitMessage({
      type: 'reveal-answer',
      question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, [this.buzzpointIndices], [' (#) ']),
      answer: this.tossup.answer
    });
  }

  togglePowermarkOnly (userId, { powermarkOnly }) {
    this.query.powermarkOnly = powermarkOnly;
    const username = this.players[userId].username;
    this.adjustQuery(['powermarkOnly'], [powermarkOnly]);
    this.emitMessage({ type: 'toggle-powermark-only', powermarkOnly, username });
  }

  toggleRebuzz (userId, { rebuzz }) {
    this.settings.rebuzz = rebuzz;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-rebuzz', rebuzz, username });
  }

  toggleSelectBySetName (userId, { selectBySetName, setName }) {
    this.query.selectBySetName = selectBySetName;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-select-by-set-name', selectBySetName, setName, username });
  }

  toggleSkip (userId, { skip }) {
    this.settings.skip = skip;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-skip', skip, username });
  }

  toggleStandardOnly (userId, { standardOnly }) {
    this.query.standardOnly = standardOnly;
    const username = this.players[userId].username;
    this.adjustQuery(['standardOnly'], [standardOnly]);
    this.emitMessage({ type: 'toggle-standard-only', standardOnly, username });
  }

  toggleTimer (userId, { timer }) {
    this.settings.timer = timer;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-timer', timer, username });
  }

  setCategories (userId, { categories, subcategories, alternateSubcategories }) {
    if (!Array.isArray(categories)) { return; }
    if (!Array.isArray(subcategories)) { return; }
    if (!Array.isArray(alternateSubcategories)) { return; }

    categories = categories.filter(category => CATEGORIES.includes(category));
    subcategories = subcategories.filter(subcategory => SUBCATEGORIES_FLATTENED.includes(subcategory));
    alternateSubcategories = alternateSubcategories.filter(subcategory => ALTERNATE_SUBCATEGORIES_FLATTENED.includes(subcategory));

    if (subcategories.some(sub => !categories.includes(SUBCATEGORY_TO_CATEGORY[sub]))) { return; }
    if (alternateSubcategories.some(sub => !categories.includes(ALTERNATE_SUBCATEGORY_TO_CATEGORY[sub]))) { return; }

    const username = this.players[userId].username;
    this.adjustQuery(['categories', 'subcategories', 'alternateSubcategories'], [categories, subcategories, alternateSubcategories]);
    this.emitMessage({ type: 'set-categories', categories, subcategories, alternateSubcategories, username });
  }

  setYearRange (userId, { minYear, maxYear }) {
    minYear = parseInt(minYear);
    maxYear = parseInt(maxYear);
    if (isNaN(minYear)) { minYear = DEFAULT_MIN_YEAR; }
    if (isNaN(maxYear)) { maxYear = DEFAULT_MAX_YEAR; }

    if (maxYear < minYear) {
      this.sendToSocket(userId, {
        type: 'set-year-range',
        minYear: this.query.minYear,
        maxYear: this.query.maxYear,
        username: null
      });
    } else {
      const username = this.players[userId].username;
      this.adjustQuery(['minYear', 'maxYear'], [minYear, maxYear]);
      this.emitMessage({ type: 'set-year-range', minYear, maxYear, username });
    }
  }
}
