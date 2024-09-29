import { PERMANENT_ROOMS, ROOM_NAME_MAX_LENGTH } from './constants.js';
import Room from './Room.js';

import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, CATEGORIES, SUBCATEGORIES_FLATTENED, ALTERNATE_SUBCATEGORIES_FLATTENED, SUBCATEGORY_TO_CATEGORY, ALTERNATE_SUBCATEGORY_TO_CATEGORY } from '../../constants.js';
import getRandomTossups from '../../database/qbreader/get-random-tossups.js';
import getSet from '../../database/qbreader/get-set.js';
import getSetList from '../../database/qbreader/get-set-list.js';
import getNumPackets from '../../database/qbreader/get-num-packets.js';

import { insertTokensIntoHTML } from '../../client/scripts/utilities/insert-tokens-into-html.js';

import checkAnswer from 'qb-answer-checker';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import isAppropriateString from '../moderation/is-appropriate-string.js';
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const QuestionProgressEnum = Object.freeze({
  NOT_STARTED: 0,
  READING: 1,
  ANSWER_REVEALED: 2
});

/**
 * @returns {Number} The number of points scored on a tossup.
 */
function scoreTossup ({ isCorrect, inPower, endOfQuestion, isPace = false }) {
  const powerValue = isPace ? 20 : 15;
  const negValue = isPace ? 0 : -5;
  return isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);
}

class TossupRoom extends Room {
  constructor (name, isPermanent = false, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name);
    this.isPermanent = isPermanent;

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
    this.paused = false;
    this.queryingQuestion = false;
    this.questionNumber = 0;
    this.questionProgress = QuestionProgressEnum.NOT_STARTED;
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
      lock: false,
      loginRequired: false,
      public: true,
      rebuzz: false,
      readingSpeed: 50,
      skip: false,
      timer: true
    };

    this.DEAD_TIME_LIMIT = 5; // time to buzz after question is read
    this.ANSWER_TIME_LIMIT = 10; // time to give answer after buzzing

    getSetList().then(setList => { this.setList = setList; });
  }

  close (userId) {
    if (this.buzzedIn === userId) {
      this.giveAnswer(userId, '');
      this.buzzedIn = null;
    }
    this.leave(userId);
  }

  connection2 (socket, userId, username, isNew) {
    socket.send(JSON.stringify({
      type: 'connection-acknowledged',
      userId,

      players: this.players,
      isPermanent: this.isPermanent,

      buzzedIn: this.buzzedIn,
      canBuzz: this.settings.rebuzz || !this.buzzes.includes(userId),
      questionProgress: this.questionProgress,

      settings: this.settings
    }));

    socket.send(JSON.stringify({
      type: 'connection-acknowledged-query',
      ...this.query
    }));

    socket.send(JSON.stringify({
      type: 'connection-acknowledged-tossup',
      tossup: this.tossup
    }));

    if (this.questionProgress === QuestionProgressEnum.READING) {
      socket.send(JSON.stringify({
        type: 'update-question',
        word: this.questionSplit.slice(0, this.wordIndex).join(' ')
      }));
    }

    if (this.questionProgress === QuestionProgressEnum.ANSWER_REVEALED && this.tossup?.answer) {
      socket.send(JSON.stringify({
        type: 'reveal-answer',
        question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, [this.buzzpointIndices], [' (#) ']),
        answer: this.tossup.answer
      }));
    }

    this.emitMessage({
      type: 'join',
      isNew,
      userId,
      username,
      user: this.players[userId]
    });
  }

  async message (userId, message) {
    switch (message.type) {
      case 'buzz': return this.buzz(userId, message);
      case 'chat': return this.chat(userId, message);
      case 'chat-live-update': return this.chatLiveUpdate(userId, message);
      case 'clear-stats': return this.clearStats(userId, message);
      case 'give-answer': return this.giveAnswer(userId, message);
      case 'give-answer-live-update': return this.giveAnswerLiveUpdate(userId, message);

      case 'next':
      case 'skip':
      case 'start':
        return this.next(userId, message);

      case 'pause': return this.pause(userId, message);
      case 'set-categories': return this.setCategories(userId, message);
      case 'set-difficulties': return this.setDifficulties(userId, message);
      case 'set-packet-numbers': return this.setPacketNumbers(userId, message);
      case 'set-reading-speed': return this.setReadingSpeed(userId, message);
      case 'set-set-name': return this.setSetName(userId, message);
      case 'set-username': return this.setUsername(userId, message);
      case 'set-year-range': return this.setYearRange(userId, message);
      case 'toggle-lock': return this.toggleLock(userId, message);
      case 'toggle-login-required': return this.toggleLoginRequired(userId, message);
      case 'toggle-powermark-only': return this.togglePowermarkOnly(userId, message);
      case 'toggle-rebuzz': return this.toggleRebuzz(userId, message);
      case 'toggle-select-by-set-name': return this.toggleSelectBySetName(userId, message);
      case 'toggle-skip': return this.toggleSkip(userId, message);
      case 'toggle-standard-only': return this.toggleStandardOnly(userId, message);
      case 'toggle-timer': return this.toggleTimer(userId, message);
      case 'toggle-visibility': return this.togglePublic(userId, message);
    }
  }

  adjustQuery (settings, values) {
    if (settings.length !== values.length) { return; }

    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i];
      const value = values[i];
      if (Object.prototype.hasOwnProperty.call(this.query, setting)) {
        this.query[setting] = value;
      }
    }

    if (this.query.selectBySetName) {
      this.questionNumber = 0;
      getSet(this.query).then(set => {
        this.setCache = set;
      });
    } else {
      getRandomTossups(this.query).then(tossups => {
        this.randomQuestionCache = tossups;
      });
    }
  }

  async advanceQuestion () {
    this.queryingQuestion = true;

    if (this.query.selectBySetName) {
      if (this.setCache.length === 0) {
        this.emitMessage({ type: 'end-of-set' });
        return false;
      } else {
        this.tossup = this.setCache.pop();
        this.questionNumber = this.tossup.number;
        this.query.packetNumbers = this.query.packetNumbers.filter(packetNumber => packetNumber >= this.tossup.packet.number);
      }
    } else {
      if (this.randomQuestionCache.length === 0) {
        this.randomQuestionCache = await getRandomTossups(this.query);
        if (this.randomQuestionCache.length === 0) {
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

  chat (userId, { message }) {
    // prevent chat messages if room is public, since they can still be sent with API
    if (this.settings.public || typeof message !== 'string') { return false; }
    const username = this.players[userId].username;
    this.emitMessage({ type: 'chat', message, username, userId });
  }

  chatLiveUpdate (userId, { message }) {
    if (this.settings.public || typeof message !== 'string') { return false; }
    const username = this.players[userId].username;
    this.emitMessage({ type: 'chat-live-update', message, username, userId });
  }

  clearStats (userId) {
    this.players[userId].clearStats();
    this.emitMessage({ type: 'clear-stats', userId });
  }

  setDifficulties (userId, { value }) {
    const invalid = value.some((value) => typeof value !== 'number' || isNaN(value) || value < 0 || value > 10);
    if (invalid) { return false; }

    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-difficulties', username, value });
    this.adjustQuery(['difficulties'], [value]);
  }

  giveAnswer (userId, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }
    if (this.buzzedIn !== userId) { return false; }

    this.liveAnswer = '';
    clearInterval(this.timer.interval);
    this.emitMessage({ type: 'timer-update', timeRemaining: this.ANSWER_TIME_LIMIT * 10 });

    if (Object.keys(this.tossup).length === 0) { return; }

    const celerity = this.questionSplit.slice(this.wordIndex).join(' ').length / this.tossup.question.length;
    const endOfQuestion = (this.wordIndex === this.questionSplit.length);
    const inPower = this.questionSplit.indexOf('(*)') >= this.wordIndex;
    const { directive, directedPrompt } = checkAnswer(this.tossup.answer, givenAnswer);
    const points = scoreTossup({ isCorrect: directive === 'accept', inPower, endOfQuestion });

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

  giveAnswerLiveUpdate (userId, { message }) {
    if (typeof message !== 'string') { return false; }
    if (userId !== this.buzzedIn) { return false; }
    this.liveAnswer = message;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'give-answer-live-update', message, username });
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
    if (this.questionProgress === QuestionProgressEnum.READING && !this.settings.skip) { return false; }
    if (type === 'skip' && this.wordIndex < 5) { return false; } // prevents spam-skipping bots

    clearTimeout(this.timeoutID);
    this.buzzedIn = null;
    this.buzzes = [];
    this.buzzpointIndices = [];
    this.paused = false;

    if (this.questionProgress !== QuestionProgressEnum.ANSWER_REVEALED) { this.revealQuestion(); }

    const hasNextQuestion = await this.advanceQuestion();
    this.queryingQuestion = false;
    if (!hasNextQuestion) { return; }

    const username = this.players[userId].username;
    this.emitMessage({ type, userId, username, tossup: this.tossup });

    this.wordIndex = 0;
    this.questionProgress = QuestionProgressEnum.READING;
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

  async setPacketNumbers (userId, { value }) {
    const allowedPacketNumbers = await getNumPackets(this.query.setName);
    if (value.some((value) => typeof value !== 'number' || value < 1 || value > allowedPacketNumbers)) { return false; }

    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-packet-numbers', username, value });
    this.adjustQuery(['packetNumbers'], [value]);
  }

  setReadingSpeed (userId, { value }) {
    if (isNaN(value)) { return false; }
    if (value > 100) { value = 100; }
    if (value < 0) { value = 0; }

    this.settings.readingSpeed = value;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-reading-speed', username, value });
  }

  async setSetName (userId, { packetNumbers, value }) {
    if (typeof value !== 'string') { return; }
    if (!this.setList) { return; }
    if (!this.setList.includes(value)) { return; }
    const maxPacketNumber = await getNumPackets(value);
    if (packetNumbers.some((num) => num > maxPacketNumber || num < 1)) { return; }

    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-set-name', username, value });
    this.adjustQuery(['setName', 'packetNumbers'], [value, packetNumbers]);
  }

  setUsername (userId, { username }) {
    if (typeof username !== 'string') { return false; }

    if (!isAppropriateString(username)) {
      this.sendToSocket(userId, {
        type: 'force-username',
        username: this.players[userId].username,
        message: 'Your username contains an inappropriate word, so it has been reverted.'
      });
    } else {
      const oldUsername = this.players[userId].username;
      const newUsername = this.players[userId].updateUsername(username);
      this.emitMessage({ type: 'set-username', userId, oldUsername, newUsername });
    }
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

    this.questionProgress = QuestionProgressEnum.ANSWER_REVEALED;
    this.emitMessage({
      type: 'reveal-answer',
      question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, [this.buzzpointIndices], [' (#) ']),
      answer: this.tossup.answer
    });
  }

  toggleLock (userId, { lock }) {
    if (this.settings.public) { return; }

    this.settings.lock = lock;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-lock', lock, username });
  }

  toggleLoginRequired (userId, { loginRequired }) {
    if (this.settings.public) { return; }

    this.settings.loginRequired = loginRequired;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-login-required', loginRequired, username });
  }

  togglePowermarkOnly (userId, { powermarkOnly }) {
    this.query.powermarkOnly = powermarkOnly;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-powermark-only', powermarkOnly, username });
    this.adjustQuery(['powermarkOnly'], [powermarkOnly]);
  }

  toggleRebuzz (userId, { rebuzz }) {
    this.settings.rebuzz = rebuzz;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-rebuzz', rebuzz, username });
  }

  toggleSelectBySetName (userId, { selectBySetName, setName }) {
    if (this.isPermanent) { return; }
    if (!this.setList) { return; }
    if (!this.setList.includes(setName)) { return; }

    this.query.selectBySetName = selectBySetName;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-select-by-set-name', selectBySetName, setName, username });
    this.adjustQuery(['setName'], [setName]);
  }

  toggleSkip (userId, { skip }) {
    this.settings.skip = skip;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-skip', skip, username });
  }

  toggleStandardOnly (userId, { standardOnly }) {
    this.query.standardOnly = standardOnly;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-standard-only', standardOnly, username });
    this.adjustQuery(['standardOnly'], [standardOnly]);
  }

  toggleTimer (userId, { timer }) {
    if (this.settings.public) { return; }
    this.settings.timer = timer;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-timer', timer, username });
  }

  togglePublic (userId, { public: isPublic }) {
    if (this.isPermanent) { return; }

    this.settings.public = isPublic;
    this.settings.timer = true;
    const username = this.players[userId].username;
    if (isPublic) {
      this.settings.lock = false;
      this.settings.loginRequired = false;
    }
    this.emitMessage({ type: 'toggle-visibility', public: isPublic, username });
  }

  setCategories (userId, { categories, subcategories, alternateSubcategories }) {
    if (this.isPermanent) { return; }
    if (!Array.isArray(categories)) { return; }
    if (!Array.isArray(subcategories)) { return; }
    if (!Array.isArray(alternateSubcategories)) { return; }

    categories = categories.filter(category => CATEGORIES.includes(category));
    subcategories = subcategories.filter(subcategory => SUBCATEGORIES_FLATTENED.includes(subcategory));
    alternateSubcategories = alternateSubcategories.filter(subcategory => ALTERNATE_SUBCATEGORIES_FLATTENED.includes(subcategory));

    if (subcategories.some(sub => !categories.includes(SUBCATEGORY_TO_CATEGORY[sub]))) { return; }
    if (alternateSubcategories.some(sub => !categories.includes(ALTERNATE_SUBCATEGORY_TO_CATEGORY[sub]))) { return; }

    const username = this.players[userId].username;
    this.emitMessage({ type: 'set-categories', categories, subcategories, alternateSubcategories, username });
    this.adjustQuery(['categories', 'subcategories', 'alternateSubcategories'], [categories, subcategories, alternateSubcategories]);
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
        maxYear: this.query.maxYear
      });
    } else {
      this.emitMessage({ type: 'set-year-range', minYear, maxYear });
      this.adjustQuery(['minYear', 'maxYear'], [minYear, maxYear]);
    }
  }
}

const tossupRooms = {};

for (const room of PERMANENT_ROOMS) {
  const { name, categories, subcategories } = room;
  tossupRooms[name] = new TossupRoom(name, true, categories, subcategories);
}

/**
 * Returns the room with the given room name.
 * If the room does not exist, it is created.
 * @param {String} roomName
 * @returns {TossupRoom}
 */
function createAndReturnRoom (roomName, isPrivate = false) {
  roomName = DOMPurify.sanitize(roomName);
  roomName = roomName?.substring(0, ROOM_NAME_MAX_LENGTH) ?? '';

  if (!Object.prototype.hasOwnProperty.call(tossupRooms, roomName)) {
    const newRoom = new TossupRoom(roomName, false);
    newRoom.settings.public = !isPrivate;
    tossupRooms[roomName] = newRoom;
  }

  return tossupRooms[roomName];
}

export { createAndReturnRoom, tossupRooms };
