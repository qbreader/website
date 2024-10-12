import ServerPlayer from './ServerPlayer.js';
import { HEADER, ENDC, OKBLUE, OKGREEN } from '../bcolors.js';
import isAppropriateString from '../moderation/is-appropriate-string.js';
import insertTokensIntoHTML from '../../quizbowl/insert-tokens-into-html.js';
import TossupRoom from '../../quizbowl/TossupRoom.js';
import RateLimit from '../RateLimit.js';

import getRandomTossups from '../../database/qbreader/get-random-tossups.js';
import getSet from '../../database/qbreader/get-set.js';
import getSetList from '../../database/qbreader/get-set-list.js';
import getNumPackets from '../../database/qbreader/get-num-packets.js';

import checkAnswer from 'qb-answer-checker';

export default class ServerTossupRoom extends TossupRoom {
  constructor (name, isPermanent = false, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name, categories, subcategories, alternateSubcategories);
    this.isPermanent = isPermanent;
    this.checkAnswer = checkAnswer;
    this.getNumPackets = getNumPackets;
    this.getRandomTossups = getRandomTossups;
    this.getSet = getSet;
    this.getSetList = getSetList;

    this.rateLimiter = new RateLimit(50, 1000);
    this.rateLimitExceeded = new Set();
    this.settings = {
      ...this.settings,
      lock: false,
      loginRequired: false,
      public: true
    };

    this.getSetList().then(setList => { this.setList = setList; });
  }

  async message (userId, message) {
    switch (message.type) {
      case 'chat': return this.chat(userId, message);
      case 'chat-live-update': return this.chatLiveUpdate(userId, message);
      case 'give-answer-live-update': return this.giveAnswerLiveUpdate(userId, message);
      case 'toggle-lock': return this.toggleLock(userId, message);
      case 'toggle-login-required': return this.toggleLoginRequired(userId, message);
      case 'toggle-public': return this.togglePublic(userId, message);
      default: super.message(userId, message);
    }
  }

  connection (socket, userId, username) {
    console.log(`Connection in room ${HEADER}${this.name}${ENDC} - userId: ${OKBLUE}${userId}${ENDC}, username: ${OKBLUE}${username}${ENDC} - with settings ${OKGREEN}${Object.keys(this.settings).map(key => [key, this.settings[key]].join(': ')).join('; ')};${ENDC}`);

    const isNew = !(userId in this.players);
    if (isNew) { this.players[userId] = new ServerPlayer(userId); }
    this.players[userId].online = true;
    this.sockets[userId] = socket;
    username = this.players[userId].safelySetUsername(username);

    socket.on('message', message => {
      if (this.rateLimiter(socket) && !this.rateLimitExceeded.has(username)) {
        console.log(`Rate limit exceeded for ${username} in room ${this.name}`);
        this.rateLimitExceeded.add(username);
        return;
      }

      try {
        message = JSON.parse(message);
      } catch (error) {
        console.log(`Error parsing message: ${message}`);
        return;
      }
      this.message(userId, message);
    });

    socket.on('close', this.close.bind(this, userId));

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

    socket.send(JSON.stringify({ type: 'connection-acknowledged-query', ...this.query }));
    socket.send(JSON.stringify({ type: 'connection-acknowledged-tossup', tossup: this.tossup }));

    if (this.questionProgress === this.QuestionProgressEnum.READING) {
      socket.send(JSON.stringify({
        type: 'update-question',
        word: this.questionSplit.slice(0, this.wordIndex).join(' ')
      }));
    }

    if (this.questionProgress === this.QuestionProgressEnum.ANSWER_REVEALED && this.tossup?.answer) {
      socket.send(JSON.stringify({
        type: 'reveal-answer',
        question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, [this.buzzpointIndices], [' (#) ']),
        answer: this.tossup.answer
      }));
    }

    this.emitMessage({ type: 'join', isNew, userId, username, user: this.players[userId] });
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

  close (userId) {
    if (this.buzzedIn === userId) {
      this.giveAnswer(userId, '');
      this.buzzedIn = null;
    }
    this.leave(userId);
  }

  giveAnswerLiveUpdate (userId, { message }) {
    if (typeof message !== 'string') { return false; }
    if (userId !== this.buzzedIn) { return false; }
    this.liveAnswer = message;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'give-answer-live-update', message, username });
  }

  next (userId, { type }) {
    if (type === 'skip' && this.wordIndex < 5) { return false; } // prevents spam-skipping bots
    super.next(userId, { type });
  }

  setCategories (userId, { categories, subcategories, alternateSubcategories }) {
    if (this.isPermanent) { return; }
    super.setCategories(userId, { categories, subcategories, alternateSubcategories });
  }

  async setSetName (userId, { packetNumbers, setName }) {
    if (!this.setList) { return; }
    if (!this.setList.includes(setName)) { return; }
    const maxPacketNumber = await this.getNumPackets(setName);
    if (packetNumbers.some((num) => num > maxPacketNumber || num < 1)) { return; }
    super.setSetName(userId, { packetNumbers, setName });
  }

  setUsername (userId, { username }) {
    if (typeof username !== 'string') { return false; }

    if (!isAppropriateString(username)) {
      this.sendToSocket(userId, {
        type: 'force-username',
        username: this.players[userId].username,
        message: 'Your username contains an inappropriate word, so it has been reverted.'
      });
      return;
    }

    const oldUsername = this.players[userId].username;
    const newUsername = this.players[userId].safelySetUsername(username);
    this.emitMessage({ type: 'set-username', userId, oldUsername, newUsername });
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

  togglePublic (userId, { public: isPublic }) {
    if (this.isPermanent) { return; }
    this.settings.public = isPublic;
    this.settings.timer = true;
    const username = this.players[userId].username;
    if (isPublic) {
      this.settings.lock = false;
      this.settings.loginRequired = false;
    }
    this.emitMessage({ type: 'toggle-public', public: isPublic, username });
  }

  toggleSelectBySetName (userId, { selectBySetName, setName }) {
    if (this.isPermanent) { return; }
    if (!this.setList) { return; }
    if (!this.setList.includes(setName)) { return; }
    super.toggleSelectBySetName(userId, { selectBySetName, setName });
    this.adjustQuery(['setName'], [setName]);
  }

  toggleTimer (userId, { timer }) {
    if (this.settings.public) { return; }
    super.toggleTimer(userId, { timer });
  }
}
