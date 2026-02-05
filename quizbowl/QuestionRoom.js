import { CATEGORIES, SUBCATEGORIES, ALTERNATE_SUBCATEGORIES, SUBCATEGORY_TO_CATEGORY, ALTERNATE_SUBCATEGORY_TO_CATEGORY } from './categories.js';
import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, MODE_ENUM } from './constants.js';
import CategoryManager from './category-manager.js'; // eslint-disable-line no-unused-vars
import Room from './Room.js';

export default class QuestionRoom extends Room {
  /**
   * @param {*} name
   * @param {CategoryManager} categoryManager
   * @param {('tossups' | 'bonuses')[]} supportedQuestionTypes - e.g. ['tossups', 'bonuses']
   */
  constructor (name, categoryManager, supportedQuestionTypes) {
    super(name);

    this.checkAnswer = function checkAnswer (answerline, givenAnswer, strictness = 7) { throw new Error('Not implemented'); };
    this.getRandomBonuses = async function getRandomBonuses (args) { throw new Error('Not implemented'); };
    this.getRandomTossups = async function getRandomTossups (args) { throw new Error('Not implemented'); };
    this.getPacket = async function getPacket (args) { throw new Error('Not implemented'); };
    this.getPacketCount = async function getPacketCount (setName) { throw new Error('Not implemented'); };
    this.getStarredTossup = async function getStarredTossup () { throw new Error('Not implemented'); };
    this.getStarredBonus = async function getStarredBonus () { throw new Error('Not implemented'); };

    if (!Array.isArray(supportedQuestionTypes) || supportedQuestionTypes.length === 0) {
      throw new Error('supportedQuestionTypes must be a non-empty array');
    }
    for (const s of supportedQuestionTypes) {
      if (!['tossups', 'bonuses'].includes(s)) {
        throw new Error(`Unsupported question type: ${s}`);
      }
    }
    if (supportedQuestionTypes.length > 2) {
      throw new Error('supportedQuestionTypes can only contain "tossups" and/or "bonuses"');
    }

    this.randomQuestionCache = {};
    this.packet = {};
    this.localPacket = {};
    this.questionIndex = {};

    for (const s of supportedQuestionTypes) {
      this.randomQuestionCache[s] = [];
      this.packet[s] = [];
      this.localPacket[s] = [];
      this.questionIndex[s] = 0;
    }

    this.categoryManager = categoryManager;
    this.mode = MODE_ENUM.RANDOM;
    this.packetCount = 24; // Length of 2024 PACE NSC
    this.queryingQuestion = false;
    this.supportedQuestionTypes = supportedQuestionTypes;
    this.useRandomQuestionCache = true;

    this.query = {
      difficulties: [4, 5],
      minYear: DEFAULT_MIN_YEAR,
      maxYear: DEFAULT_MAX_YEAR,
      packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
      setName: '2023 PACE NSC',
      reverse: true, // used for `database.getSet`
      standardOnly: false,
      ...this.categoryManager.export()
    };

    this.settings = {
      /**
       * Whether or not the order of the questions in a **local packet** is randomized.
       */
      randomizeOrder: false,
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
      case 'set-max-year': return this.setMaxYear(userId, message);
      case 'set-min-year': return this.setMinYear(userId, message);
      case 'toggle-randomize-order': return this.toggleRandomizeOrder(userId, message);
      case 'toggle-skip': return this.toggleSkip(userId, message);
      case 'toggle-standard-only': return this.toggleStandardOnly(userId, message);
      case 'toggle-timer': return this.toggleTimer(userId, message);
      case 'upload-local-packet': return this.uploadLocalPacket(userId, message);
      default: return super.message(userId, message);
    }
  }

  /**
   *
   * @param {boolean} [doNotFetch=false] - If true, the query will not be fetched from the database.
   * @returns
   */
  async adjustQuery (settings, values, doNotFetch = false) {
    if (settings.length !== values.length) { return; }

    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i];
      const value = values[i];
      if (Object.prototype.hasOwnProperty.call(this.query, setting)) {
        this.query[setting] = value;
      }
    }

    if (doNotFetch) { return; }

    switch (this.mode) {
      case MODE_ENUM.SET_NAME:
        this.packet = await this.getPacket({ setName: this.query.setName, packetNumber: this.query.packetNumbers[0] });
        break;
      case MODE_ENUM.RANDOM:
        for (const s of this.supportedQuestionTypes) {
          const query = { ...this.query, number: 1 };
          this.randomQuestionCache[s] = this.categoryManager.percentView
            ? []
            : await this.getRandomQuestions(s, query);
        }
        break;
    }
  }

  async getNextQuestion (questionType) {
    if (!this.supportedQuestionTypes.includes(questionType)) { return; }
    this.queryingQuestion = true;
    let question = null;

    if (this.mode === MODE_ENUM.RANDOM) {
      if (this.categoryManager.percentView) {
        const randomCategory = this.categoryManager.getRandomCategory();
        this.randomQuestionCache[questionType] = await this.getRandomQuestions(questionType, { ...this.query, number: 1, categories: [randomCategory], subcategories: [], alternateSubcategories: [] });
      } else if (this.randomQuestionCache[questionType].length === 0) {
        const cacheSize = this.useRandomQuestionCache ? 20 : 1;
        this.randomQuestionCache[questionType] = await this.getRandomQuestions(questionType, { ...this.query, number: cacheSize });
      }
      if (this.randomQuestionCache[questionType]?.length === 0) {
        return this.emitMessage({ type: 'no-questions-found' });
      }
      return this.randomQuestionCache[questionType].pop();
    }

    do {
      switch (this.mode) {
        case MODE_ENUM.SET_NAME:
          if (this.questionIndex[questionType] === this.packet[questionType].length) {
            this.questionIndex[questionType] = 0;
            this.query.packetNumbers.shift();
            const packetNumber = this.query.packetNumbers[0];
            if (packetNumber === undefined) {
              return this.emitMessage({ type: 'end-of-set' });
            }
            this.packet = await this.getPacket({ setName: this.query.setName, packetNumber });
          }
          question = this.packet[questionType][this.questionIndex[questionType]];
          this.questionIndex[questionType]++;
          break;

        case MODE_ENUM.STARRED:
          question = questionType === 'tossups' ? await this.getStarredTossup() : await this.getStarredBonus();
          break;

        case MODE_ENUM.LOCAL:
          question = this.getNextLocalQuestion(questionType);
          break;
      }

      if (!question) { return this.emitMessage({ type: 'no-questions-found' }); }
    } while (!this.categoryManager.isValidCategory(question));
    return question;
  }

  getNextLocalQuestion (questionType) {
    if (this.localPacket[questionType].length === 0) { return null; }
    if (this.settings.randomizeOrder) {
      const randomIndex = Math.floor(Math.random() * this.localPacket[questionType].length);
      return this.localPacket[questionType].splice(randomIndex, 1)[0];
    }
    return this.localPacket[questionType].shift();
  }

  getRandomQuestions (questionType, query) {
    return questionType === 'tossups' ? this.getRandomTossups(query) : this.getRandomBonuses(query);
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

  setDifficulties (userId, { difficulties }) {
    const invalid = difficulties.some(value => typeof value !== 'number' || isNaN(value) || value < 0 || value > 10);
    if (invalid) { return false; }
    const username = this.players[userId].username;
    this.adjustQuery(['difficulties'], [difficulties]);
    this.emitMessage({ type: 'set-difficulties', username, difficulties });
  }

  setMaxYear (userId, { maxYear, doNotFetch = false }) {
    maxYear = parseInt(maxYear);
    if (isNaN(maxYear)) { maxYear = DEFAULT_MAX_YEAR; }
    maxYear = Math.max(maxYear, this.query.minYear);
    const username = this.players[userId].username;
    this.adjustQuery(['maxYear'], [maxYear], doNotFetch);
    this.emitMessage({ type: 'set-max-year', maxYear, username });
  }

  setMinYear (userId, { minYear, doNotFetch = false }) {
    minYear = parseInt(minYear);
    if (isNaN(minYear)) { minYear = DEFAULT_MIN_YEAR; }
    minYear = Math.min(minYear, this.query.maxYear);
    const username = this.players[userId].username;
    this.adjustQuery(['minYear'], [minYear], doNotFetch);
    this.emitMessage({ type: 'set-min-year', minYear, username });
  }

  setMode (userId, { mode }) {
    if (!Object.values(MODE_ENUM).includes(mode)) { return; }
    this.mode = mode;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-mode', mode, username });
  }

  setPacketNumbers (userId, { doNotFetch = false, packetNumbers }) {
    if (!Array.isArray(packetNumbers)) { return false; }
    if (packetNumbers.some(value => typeof value !== 'number' || value < 1 || value > this.packetCount)) { return false; }
    const username = this.players[userId].username;
    this.adjustQuery(['packetNumbers'], [packetNumbers], doNotFetch);
    this.emitMessage({ type: 'set-packet-numbers', username, packetNumbers });
  }

  async setSetName (userId, { doNotFetch = false, setName }) {
    if (typeof setName !== 'string') { return; }
    const username = this.players[userId].username;
    this.packetCount = await this.getPacketCount(setName);
    const packetNumbers = [];
    for (let i = 1; i <= this.packetCount; i++) { packetNumbers.push(i); }
    this.adjustQuery(['setName', 'packetNumbers'], [setName, packetNumbers], doNotFetch);
    this.emitMessage({ type: 'set-set-name', username, setName, setLength: this.packetCount });
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

  toggleRandomizeOrder (userId, { randomizeOrder }) {
    this.settings.randomizeOrder = randomizeOrder;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-randomize-order', randomizeOrder, username });
  }

  toggleSkip (userId, { skip }) {
    this.settings.skip = skip;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-skip', skip, username });
  }

  toggleStandardOnly (userId, { doNotFetch = false, standardOnly }) {
    this.query.standardOnly = standardOnly;
    const username = this.players[userId].username;
    this.adjustQuery(['standardOnly'], [standardOnly], doNotFetch);
    this.emitMessage({ type: 'toggle-standard-only', standardOnly, username });
  }

  toggleTimer (userId, { timer }) {
    this.settings.timer = timer;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-timer', timer, username });
  }

  uploadLocalPacket (userId, { filename, packet }) {
    if (typeof filename !== 'string' || filename.length === 0) { return; }
    if (typeof packet !== 'object' || packet === null) { return; }

    for (const s of this.supportedQuestionTypes) {
      if (!Object.prototype.hasOwnProperty.call(packet, s)) { return; }
      this.localPacket[s] = [];
    }

    for (const s of this.supportedQuestionTypes) {
      const questions = packet[s];
      if (!Array.isArray(questions)) { return; }
      // detect if number is contained in filename
      const match = filename.match(/\d+/);
      const rawPacketNumber = parseInt(match?.[0]);
      const packetNumber = isNaN(rawPacketNumber) ? 1 : rawPacketNumber;
      for (let i = 0; i < questions.length; i++) {
        questions[i]._id = Math.random().toString(16).slice(2); // generate a random id
        questions[i].number = i + 1;
        questions[i].packet = { number: packetNumber };
        questions[i].set = { name: filename };
      }
      this.localPacket[s] = questions;
    }

    this.emitMessage({ type: 'alert', message: `Successfully uploaded ${this.localPacket.tossups.length} tossups and ${this.localPacket.bonuses.length} bonuses.`, userId });
  }
}
