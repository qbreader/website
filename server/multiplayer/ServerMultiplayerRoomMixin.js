import ServerPlayer from './ServerPlayer.js';
import Votekick from './VoteKick.js';
import { HEADER, ENDC, OKCYAN, OKBLUE } from '../bcolors.js';
import isAppropriateString from '../moderation/is-appropriate-string.js';
import { MODE_ENUM, QUESTION_TYPE_ENUM, TOSSUP_PROGRESS_ENUM } from '../../quizbowl/constants.js';
import insertTokensIntoHTML from '../../quizbowl/insert-tokens-into-html.js';
// import TossupRoom from '../../quizbowl/TossupRoom.js';
import RateLimit from '../RateLimit.js';

import getRandomTossups from '../../database/qbreader/get-random-tossups.js';
import getRandomBonuses from '../../database/qbreader/get-random-bonuses.js';
import getPacket from '../../database/qbreader/get-packet.js';
import getSetList from '../../database/qbreader/get-set-list.js';
import getNumPackets from '../../database/qbreader/get-num-packets.js';

import checkAnswer from 'qb-answer-checker';
import Team from '../../quizbowl/Team.js';

const BAN_DURATION = 1000 * 60 * 30; // 30 minutes

const ServerMultiplayerRoomMixin = (RoomClass) => class extends RoomClass {
  constructor (name, ownerId, isPermanent, categoryManager, supportedQuestionTypes, isVerified = false) {
    super(name, categoryManager, supportedQuestionTypes);
    this.ownerId = ownerId;
    this.isPermanent = isPermanent;
    this.isVerified = isVerified;
    this.checkAnswer = checkAnswer;
    this.getPacketCount = getNumPackets;

    this.getRandomTossups = getRandomTossups;
    this.getRandomBonuses = getRandomBonuses;

    this.getPacket = getPacket;
    this.bannedUserList = new Map();
    this.kickedUserList = new Map();
    this.votekickList = [];
    this.lastVotekickTime = {};

    this.rateLimiter = new RateLimit(50, 1000);
    this.rateLimitExceeded = new Set();
    this.settings = {
      ...this.settings,
      lock: false,
      loginRequired: isVerified,
      public: true,
      controlled: false
    };

    getSetList().then(setList => { this.packetList = setList; });
    setInterval(this.cleanupExpiredBansAndKicks.bind(this), 5 * 60 * 1000); // 5 minutes
  }

  async message (userId, message) {
    switch (message.type) {
      case 'ban': return this.ban(userId, message);
      case 'chat': return this.chat(userId, message);
      case 'chat-live-update': return this.chatLiveUpdate(userId, message);
      case 'give-answer-live-update': return this.giveAnswerLiveUpdate(userId, message);
      case 'toggle-controlled': return this.toggleControlled(userId, message);
      case 'toggle-lock': return this.toggleLock(userId, message);
      case 'toggle-login-required': return this.toggleLoginRequired(userId, message);
      case 'toggle-mute': return this.toggleMute(userId, message);
      case 'toggle-public': return this.togglePublic(userId, message);
      case 'votekick-init': return this.votekickInit(userId, message);
      case 'votekick-vote': return this.votekickVote(userId, message);
      default: super.message(userId, message);
    }
  }

  allowed (userId) {
    return (userId === this.ownerId) || this.settings.public || !this.settings.controlled;
  }

  ban (userId, { targetId, targetUsername }) {
    console.log('Ban request received. Target ' + targetId);
    if (this.ownerId !== userId) { return; }

    this.emitMessage({ type: 'confirm-ban', targetId, targetUsername });
    this.bannedUserList.set(targetId, Date.now());

    setTimeout(() => this.closeConnection(targetId), 1000);
  }

  connection (socket, userId, username, ip, userAgent = '') {
    console.log(
      `Connection in room ${HEADER}${this.name}${ENDC};`,
      `ip: ${OKCYAN}${ip}${ENDC};`,
      userAgent ? `userAgent: ${OKCYAN}${userAgent}${ENDC};` : '',
      `userId: ${OKBLUE}${userId}${ENDC};`,
      `username: ${OKBLUE}${username}${ENDC};`
    );
    this.cleanupExpiredBansAndKicks();

    if (this.sockets[userId]) {
      this.sendToSocket(userId, { type: 'error', message: 'You joined on another tab' });
      setTimeout(() => this.closeConnection(userId), 5000);
    }

    const isNew = !(userId in this.players);
    if (isNew) {
      this.players[userId] = new ServerPlayer(userId);
      this.players[userId].teamId = userId;
      this.teams[userId] = new Team(userId);
    }
    this.players[userId].online = true;
    this.sockets[userId] = socket;
    username = this.players[userId].safelySetUsername(username);

    if (this.bannedUserList.has(userId)) {
      console.log(`Banned user ${userId} (${username}) tried to join a room`);
      this.sendToSocket(userId, { type: 'enforcing-removal', removalType: 'ban' });
      return;
    }

    if (this.kickedUserList.has(userId)) {
      console.log(`Kicked user ${userId} (${username}) tried to join a room`);
      this.sendToSocket(userId, { type: 'enforcing-removal', removalType: 'kick' });
      return;
    }

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

    socket.on('close', this.closeConnection.bind(this, userId));

    socket.send(JSON.stringify({
      type: 'connection-acknowledged',
      userId,

      bonusProgress: this.bonusProgress,
      bonusEligibleTeamId: this.bonusEligibleTeamId,
      buzzedIn: this.buzzedIn,
      canBuzz: this.settings.rebuzz || !this.buzzes.includes(userId),
      currentQuestionType: this.currentQuestionType,
      isPermanent: this.isPermanent,
      isVerified: this.isVerified,
      mode: this.mode,
      ownerId: this.ownerId,
      packetLength: this.packetCount,
      players: this.players,
      teams: this.teams,
      tossupProgress: this.tossupProgress,
      packetCount: this.packetCount,
      settings: this.settings
    }));

    socket.send(JSON.stringify({ type: 'connection-acknowledged-query', ...this.query, ...this.categoryManager.export() }));
    socket.send(JSON.stringify({
      type: 'connection-acknowledged-question',
      currentQuestionType: this.currentQuestionType,
      question: this.currentQuestionType === QUESTION_TYPE_ENUM.TOSSUP ? this.tossup : this.bonus
    }));

    if (this.currentQuestionType === QUESTION_TYPE_ENUM.TOSSUP) {
      if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.READING) {
        socket.send(JSON.stringify({
          type: 'update-question',
          word: this.questionSplit.slice(0, this.wordIndex).join(' ')
        }));
      }

      if (this.tossupProgress === TOSSUP_PROGRESS_ENUM.ANSWER_REVEALED && this.tossup?.answer) {
        socket.send(JSON.stringify({
          type: 'reveal-tossup-answer',
          question: insertTokensIntoHTML(this.tossup.question, this.tossup.question_sanitized, { ' (#) ': this.buzzpointIndices }),
          answer: this.tossup.answer
        }));
      }
    } else if (this.currentQuestionType === QUESTION_TYPE_ENUM.BONUS) {
      socket.send(JSON.stringify({ type: 'reveal-leadin', leadin: this.bonus.leadin }));
      // Reveal each part that has been shown
      for (let i = 0; i <= this.currentPartNumber && i < this.bonus.parts.length; i++) {
        socket.send(JSON.stringify({
          type: 'reveal-next-part',
          currentPartNumber: i,
          part: this.bonus.parts[i],
          value: this.bonus.values?.[i] ?? 10
        }));

        // If this part has been answered, reveal its answer
        if (i < this.pointsPerPart.length) {
          socket.send(JSON.stringify({
            type: 'reveal-next-answer',
            answer: this.bonus.answers[i],
            currentPartNumber: i,
            lastPartRevealed: i === this.bonus.parts.length - 1
          }));
        }
      }
    }

    this.emitMessage({ type: 'join', isNew, team: this.teams[this.players[userId].teamId], userId, username, user: this.players[userId] });
  }

  chat (userId, { message }) {
    // prevent chat messages if room is public, since they can still be sent with API
    if (this.settings.public && !this.settings.loginRequired) { return false; }
    if (typeof message !== 'string') { return false; }
    const username = this.players[userId].username;
    this.emitMessage({ type: 'chat', message, username, userId });
  }

  chatLiveUpdate (userId, { message }) {
    if (this.settings.public && !this.settings.loginRequired) { return false; }
    if (typeof message !== 'string') { return false; }
    const username = this.players[userId].username;
    this.emitMessage({ type: 'chat-live-update', message, username, userId });
  }

  cleanupExpiredBansAndKicks () {
    const now = Date.now();

    this.bannedUserList.forEach((banTime, userId) => {
      if (now - banTime > BAN_DURATION) {
        this.bannedUserList.delete(userId);
      }
    });

    this.kickedUserList.forEach((kickTime, userId) => {
      if (now - kickTime > BAN_DURATION) {
        this.kickedUserList.delete(userId);
      }
    });
  }

  closeConnection (userId) {
    if (!this.players[userId]) { return; }

    if (this.currentQuestionType === QUESTION_TYPE_ENUM.TOSSUP) {
      if (this.buzzedIn === userId) {
        this.giveAnswer(userId, { givenAnswer: this.liveAnswer });
        this.buzzedIn = null;
      }
    } else if (this.currentQuestionType === QUESTION_TYPE_ENUM.BONUS) {
      this.endCurrentBonus(userId);
      this.startNextTossup(userId);
    }

    this.leave(userId);
  }

  giveAnswerLiveUpdate (userId, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }
    this.liveAnswer = givenAnswer;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'give-answer-live-update', givenAnswer, username });
  }

  removeAllPlayers () {
    for (const userId of Object.keys(this.players)) {
      this.players[userId].online = false;
      if (Object.keys(this.sockets).includes(userId)) {
        this.sendToSocket(userId, { type: 'admin-lock', message: 'An admin has locked this room.' });
        delete this.sockets[userId];
      }
    }
  }

  setCategories (userId, { categories, subcategories, alternateSubcategories, percentView, categoryPercents }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setCategories(userId, { categories, subcategories, alternateSubcategories, percentView, categoryPercents });
  }

  setMode (userId, { mode }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    if (this.mode !== MODE_ENUM.SET_NAME && this.mode !== MODE_ENUM.RANDOM) { return; }
    super.setMode(userId, { mode });
    this.adjustQuery(['setName'], [this.query.setName]);
  }

  setPacketNumbers (userId, { packetNumbers }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setPacketNumbers(userId, { doNotFetch: false, packetNumbers });
  }

  setReadingSpeed (userId, { readingSpeed }) {
    if (this.isPermanent || !this.allowed(userId)) { return false; }
    super.setReadingSpeed(userId, { readingSpeed });
  }

  async setSetName (userId, { setName }) {
    if (!this.allowed(userId)) { return; }
    if (!this.packetList) { return; }
    if (!this.packetList.includes(setName)) { return; }
    super.setSetName(userId, { doNotFetch: false, setName });
  }

  setStrictness (userId, { strictness }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setStrictness(userId, { strictness });
  }

  setMinYear (userId, { minYear }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setMinYear(userId, { minYear });
  }

  setMaxYear (userId, { maxYear }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.setMaxYear(userId, { maxYear });
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

  toggleControlled (userId, { controlled }) {
    if (this.settings.public) { return; }
    if (userId !== this.ownerId) { return; }
    this.settings.controlled = !!controlled;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-controlled', controlled, username });
  }

  toggleEnableBonuses (userId, { enableBonuses }) {
    if (this.isPermanent || !this.allowed(userId)) { return; }
    super.toggleEnableBonuses(userId, { enableBonuses });
  }

  toggleLock (userId, { lock }) {
    if (this.settings.public || !this.allowed(userId)) { return; }
    this.settings.lock = lock;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-lock', lock, username });
  }

  toggleLoginRequired (userId, { loginRequired }) {
    if (this.isVerified || this.settings.public || !this.allowed(userId)) { return; }
    this.settings.loginRequired = loginRequired;
    const username = this.players[userId].username;
    this.emitMessage({ type: 'toggle-login-required', loginRequired, username });
  }

  toggleMute (userId, { targetId, targetUsername, muteStatus }) {
    if (userId !== this.ownerId) return;
    this.sendToSocket(userId, { type: 'mute-player', targetId, targetUsername, muteStatus });
  }

  togglePowermarkOnly (userId, { powermarkOnly }) {
    if (!this.allowed(userId)) { return; }
    super.togglePowermarkOnly(userId, { powermarkOnly });
  }

  toggleSkip (userId, { skip }) {
    if (!this.allowed(userId)) { return; }
    super.toggleSkip(userId, { skip });
  }

  toggleStandardOnly (userId, { standardOnly }) {
    if (!this.allowed(userId)) { return; }
    super.toggleStandardOnly(userId, { doNotFetch: false, standardOnly });
  }

  togglePublic (userId, { public: isPublic }) {
    if (this.isPermanent || this.settings.controlled) { return; }
    this.settings.public = isPublic;
    const username = this.players[userId].username;
    if (isPublic) {
      this.settings.lock = false;
      this.settings.loginRequired = false;
      this.settings.timer = true;
    }
    this.emitMessage({ type: 'toggle-public', public: isPublic, username });
  }

  toggleRebuzz (userId, { rebuzz }) {
    if (!this.allowed(userId)) { return false; }
    super.toggleRebuzz(userId, { rebuzz });
  }

  toggleTimer (userId, { timer }) {
    if (this.settings.public || !this.allowed(userId)) { return; }
    super.toggleTimer(userId, { timer });
  }

  votekickInit (userId, { targetId }) {
    if (this.players[userId].tens === 0 && this.players[userId].powers === 0) { return; }
    if (!this.players[targetId]) { return; }
    const targetUsername = this.players[targetId].username;

    const currentTime = Date.now();
    if (this.lastVotekickTime[userId] && (currentTime - this.lastVotekickTime[userId] < 90000)) {
      return;
    }

    this.lastVotekickTime[userId] = currentTime;

    for (const votekick of this.votekickList) {
      if (votekick.exists(targetId)) { return; }
    }
    let activePlayers = 0;
    Object.keys(this.players).forEach(playerId => {
      if (this.players[playerId].online) {
        activePlayers += 1;
      }
    });

    const threshold = Math.max(Math.floor(activePlayers * 3 / 4), 2);
    const votekick = new Votekick(targetId, threshold, []);
    votekick.vote(userId);
    this.votekickList.push(votekick);
    if (votekick.check()) {
      this.emitMessage({ type: 'successful-vk', targetUsername, targetId });
      this.kickedUserList.set(targetId, Date.now());
    } else {
      this.kickedUserList.set(targetId, Date.now());
      this.emitMessage({ type: 'initiated-vk', targetUsername, threshold });
    }
  }

  votekickVote (userId, { targetId }) {
    if (this.players[userId].tens === 0 && this.players[userId].powers === 0) {
      this.emitMessage({ type: 'no-points-votekick-attempt', userId });
      return;
    }
    if (!this.players[targetId]) { return; }
    const targetUsername = this.players[targetId].username;

    let exists = false;
    let thisVotekick;
    for (const votekick of this.votekickList) {
      if (votekick.exists(targetId)) {
        thisVotekick = votekick;
        exists = true;
      }
    }
    if (!exists) { return; }

    thisVotekick.vote(userId);
    if (thisVotekick.check()) {
      this.emitMessage({ type: 'successful-vk', targetUsername, targetId });
      this.kickedUserList.set(targetId, Date.now());

      setTimeout(() => this.closeConnection(userId), 1000);

      if (targetId === this.ownerId) {
        const onlinePlayers = Object.keys(this.players).filter(playerId => this.players[playerId].online && playerId !== targetId);
        const newHost = onlinePlayers.reduce(
          (maxPlayer, playerId) => (this.players[playerId].tuh || 0) > (this.players[maxPlayer].tuh || 0) ? playerId : maxPlayer,
          onlinePlayers[0]
        );
        // ^^ highest tuh player becomes new host

        this.ownerId = newHost;

        this.emitMessage({ type: 'owner-change', newOwner: newHost });
      }
    }
  }
};

export default ServerMultiplayerRoomMixin;
