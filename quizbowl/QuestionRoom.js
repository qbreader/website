import { CATEGORIES, SUBCATEGORIES, ALTERNATE_SUBCATEGORIES, SUBCATEGORY_TO_CATEGORY, ALTERNATE_SUBCATEGORY_TO_CATEGORY } from './categories.js';
import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, MODE_ENUM } from './constants.js';
import CategoryManager from './category-manager.js';
import Room from './Room.js';

export default class QuestionRoom extends Room {
  constructor (name, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name);

    this.checkAnswer = function checkAnswer (answerline, givenAnswer, strictness = 7) { throw new Error('Not implemented'); };
    this.getRandomQuestions = async function getRandomQuestions (args) { throw new Error('Not implemented'); };
    this.getSet = async function getSet (args) { throw new Error('Not implemented'); };
    this.getSetList = async function getSetList (args) { throw new Error('Not implemented'); };
    this.getNumPackets = async function getNumPackets (setName) { throw new Error('Not implemented'); };
    this.getRandomStarredQuestion = async function getRandomStarredQuestion () { throw new Error('Not implemented'); };

    this.categoryManager = new CategoryManager(categories, subcategories, alternateSubcategories);
    this.packetLength = undefined;
    this.queryingQuestion = false;
    this.randomQuestionCache = [];
    this.setCache = [];
    this.setLength = 24; // length of 2023 PACE NSC

    this.mode = MODE_ENUM.RANDOM;

    this.query = {
      difficulties: [4, 5],
      minYear: DEFAULT_MIN_YEAR,
      maxYear: DEFAULT_MAX_YEAR,
      packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
      setName: '2023 PACE NSC',
      alternateSubcategories,
      categories,
      subcategories,
      percentView: false,
      categoryPercents: CATEGORIES.map(() => 0),
      reverse: true, // used for `database.getSet`
      standardOnly: false
    };

    this.settings = {
      strictness: 7,
      skip: false,
      timer: true
    };
  }

  message (userId, message) {
    switch (message.type) {
      case 'set-categories': return this.setCategories(userId, message);
      case 'set-difficulties': return this.setDifficulties(userId, message);
      case 'set-mode': return this.setMode(userId, message);
      case 'set-packet-numbers': return this.setPacketNumbers(userId, message);
      case 'set-set-name': return this.setSetName(userId, message);
      case 'set-strictness': return this.setStrictness(userId, message);
      case 'set-username': return this.setUsername(userId, message);
      case 'set-year-range': return this.setYearRange(userId, message);
      case 'toggle-skip': return this.toggleSkip(userId, message);
      case 'toggle-standard-only': return this.toggleStandardOnly(userId, message);
      case 'toggle-timer': return this.toggleTimer(userId, message);
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

    switch (this.mode) {
      case MODE_ENUM.SET_NAME:
        this.setCache = await this.getSet({ setName: this.query.setName, packetNumbers: [this.query.packetNumbers[0]] });
        this.packetLength = this.setCache.length;
        break;
      case MODE_ENUM.RANDOM:
        if (this.categoryManager.percentView) {
          this.randomQuestionCache = [];
        } else {
          this.randomQuestionCache = await this.getRandomQuestions({ ...this.query, number: 1 });
        }
        break;
    }
  }

  async advanceQuestion () {
    this.queryingQuestion = true;
    let question = null;

    switch (this.mode) {
      case MODE_ENUM.SET_NAME:
        do {
          if (this.setCache.length === 0) {
            this.query.packetNumbers.shift();
            const packetNumber = this.query.packetNumbers[0];
            if (packetNumber === undefined) {
              this.emitMessage({ type: 'end-of-set' });
              return null;
            }
            this.setCache = await this.getSet({ setName: this.query.setName, packetNumbers: [packetNumber] });
            this.packetLength = this.setCache.length;
          }

          question = this.setCache.shift();
          if (!question?.packet?.number) {
            this.emitMessage({ type: 'no-questions-found' });
            return null;
          }
          this.query.packetNumbers = this.query.packetNumbers.filter(packetNumber => packetNumber >= question.packet.number);
        } while (!this.categoryManager.isValidCategory(question));
        break;
      case MODE_ENUM.RANDOM:
        if (this.categoryManager.percentView) {
          const randomCategory = this.categoryManager.getRandomCategory();
          this.randomQuestionCache = await this.getRandomQuestions({ ...this.query, number: 1, categories: [randomCategory], subcategories: [], alternateSubcategories: [] });
        } else if (this.randomQuestionCache.length === 0) {
          this.randomQuestionCache = await this.getRandomQuestions({ ...this.query, number: 20 });
        }

        if (this.randomQuestionCache?.length === 0) {
          this.emitMessage({ type: 'no-questions-found' });
          return null;
        }
        question = this.randomQuestionCache.pop();
        break;
      case MODE_ENUM.STARRED:
        question = await this.getRandomStarredQuestion();
        if (question === null) {
          this.emitMessage({ type: 'no-questions-found' });
          return null;
        }
        break;
    }

    return question;
  }

  setDifficulties (userId, { difficulties }) {
    const invalid = difficulties.some((value) => typeof value !== 'number' || isNaN(value) || value < 0 || value > 10);
    if (invalid) { return false; }

    const username = this.players[userId].username;
    this.adjustQuery(['difficulties'], [difficulties]);
    this.emitMessage({ type: 'set-difficulties', username, difficulties });
  }

  setMode (userId, { mode, setName }) {
    if (!Object.values(MODE_ENUM).includes(mode)) { return; }
    this.mode = mode;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-mode', mode, setName, username });
  }

  async setPacketNumbers (userId, { packetNumbers }) {
    if (!Array.isArray(packetNumbers)) { return false; }
    if (packetNumbers.some((value) => typeof value !== 'number' || value < 1 || value > this.setLength)) { return false; }

    const username = this.players[userId].username;
    this.adjustQuery(['packetNumbers'], [packetNumbers]);
    this.emitMessage({ type: 'set-packet-numbers', username, packetNumbers });
  }

  async setSetName (userId, { setName }) {
    if (typeof setName !== 'string') { return; }
    const username = this.players[userId].username;
    this.setLength = await this.getNumPackets(setName);
    const packetNumbers = [];
    for (let i = 1; i <= this.setLength; i++) { packetNumbers.push(i); }
    this.adjustQuery(['setName', 'packetNumbers'], [setName, packetNumbers]);
    this.emitMessage({ type: 'set-set-name', username, setName, setLength: this.setLength });
  }

  setStrictness (userId, { strictness }) {
    this.settings.strictness = strictness;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-strictness', username, strictness });
  }

  startServerTimer (time, ontick, callback) {
    if (!this.settings.timer) { return; }
    super.startServerTimer(time, ontick, callback);
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

  setCategories (userId, { categories, subcategories, alternateSubcategories, percentView, categoryPercents }) {
    if (!Array.isArray(categories)) { return; }
    if (!Array.isArray(subcategories)) { return; }
    if (!Array.isArray(alternateSubcategories)) { return; }
    if (categoryPercents?.length !== CATEGORIES.length) { return; }

    categories = categories.filter(category => CATEGORIES.includes(category));
    subcategories = subcategories.filter(subcategory => SUBCATEGORIES.includes(subcategory));
    alternateSubcategories = alternateSubcategories.filter(subcategory => ALTERNATE_SUBCATEGORIES.includes(subcategory));

    if (subcategories.some(sub => !categories.includes(SUBCATEGORY_TO_CATEGORY[sub]))) { return; }
    if (alternateSubcategories.some(sub => !categories.includes(ALTERNATE_SUBCATEGORY_TO_CATEGORY[sub]))) { return; }

    this.categoryManager.import({ categories, subcategories, alternateSubcategories, percentView, categoryPercents });

    const username = this.players[userId].username;
    this.adjustQuery(
      ['categories', 'subcategories', 'alternateSubcategories', 'percentView', 'categoryPercents'],
      [categories, subcategories, alternateSubcategories, percentView, categoryPercents]
    );
    this.emitMessage({ type: 'set-categories', ...this.categoryManager.export(), username });
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
