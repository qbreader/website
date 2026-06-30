import ServerPlayer from './ServerPlayer.js';
import BanKickMixin from './BanKickMixin.js';
import RoomSettingsMixin from './RoomSettingsMixin.js';
import VotekickMixin from './VotekickMixin.js';
import { HEADER, ENDC, OKCYAN, OKBLUE } from '../bcolors.js';
import isAppropriateString from '../moderation/is-appropriate-string.js';
import { QUESTION_TYPE_ENUM, TOSSUP_PROGRESS_ENUM } from '../../quizbowl/constants.js';
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

const ServerMultiplayerRoomMixin = (RoomClass) => class extends BanKickMixin(RoomSettingsMixin(VotekickMixin(RoomClass))) {
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

  async message ({ userId, username }, message) {
    switch (message.type) {
      case 'ban': return this.ban({ userId, username }, message);
      case 'chat': return this.chat({ userId, username }, message);
      case 'chat-live-update': return this.chatLiveUpdate({ userId, username }, message);
      case 'give-answer-live-update': return this.giveAnswerLiveUpdate({ userId, username }, message);
      case 'toggle-controlled': return this.toggleControlled({ userId, username }, message);
      case 'toggle-lock': return this.toggleLock({ userId, username }, message);
      case 'toggle-login-required': return this.toggleLoginRequired({ userId, username }, message);
      case 'toggle-mute': return this.toggleMute({ userId, username }, message);
      case 'toggle-public': return this.togglePublic({ userId, username }, message);
      case 'votekick-init': return this.votekickInit({ userId, username }, message);
      case 'votekick-vote': return this.votekickVote({ userId, username }, message);
      default: super.message({ userId, username }, message);
    }
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
      setTimeout(() => this.closeConnection({ userId, username }), 5000);
    }

    const isNew = !(userId in this.players);
    if (isNew) {
      this.players[userId] = new ServerPlayer(userId);
      const teamId = userId;
      this.players[userId].teamId = teamId;
      this.teams[teamId] = new Team(teamId);
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
      this.message({ userId, username: this.players[userId]?.username }, message);
    });

    socket.on('close', this.closeConnection.bind(this, { userId, username }));

    socket.send(JSON.stringify({
      type: 'connection-acknowledged',
      teamId: this.players[userId].teamId,
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

  chat ({ userId, username }, { message }) {
    // prevent chat messages if room is public, since they can still be sent with API
    if (this.settings.public && !this.settings.loginRequired) { return false; }
    if (typeof message !== 'string') { return false; }
    if (!isAppropriateString(message)) { return false; }
    this.emitMessage({ type: 'chat', message, username, userId });
  }

  chatLiveUpdate ({ userId, username }, { message }) {
    if (this.settings.public && !this.settings.loginRequired) { return false; }
    if (typeof message !== 'string') { return false; }
    if (!isAppropriateString(message)) { return false; }
    this.emitMessage({ type: 'chat-live-update', message, username, userId });
  }

  closeConnection ({ userId, username }) {
    if (!this.players[userId]) { return; }

    if (this.currentQuestionType === QUESTION_TYPE_ENUM.TOSSUP) {
      if (this.buzzedIn === userId) {
        this.giveAnswer({ userId, username }, { givenAnswer: this.liveAnswer });
        this.buzzedIn = null;
      }
    } else if (this.currentQuestionType === QUESTION_TYPE_ENUM.BONUS) {
      const allowed = this.endCurrentBonus({ userId, username });
      if (allowed) {
        this.startNextTossup({ userId, username });
      }
    }

    this.leave(userId);
  }

  giveAnswerLiveUpdate ({ userId, username }, { givenAnswer }) {
    if (typeof givenAnswer !== 'string') { return false; }
    this.liveAnswer = givenAnswer;
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
};

export default ServerMultiplayerRoomMixin;
