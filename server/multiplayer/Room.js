import { HEADER, ENDC, OKBLUE, OKGREEN } from '../bcolors.js';
import Player from './Player.js';
import RateLimit from '../RateLimit.js';
const rateLimiter = new RateLimit(50, 1000);

export default class Room {
  /**
   * @param {string} name - The name of the room
   */
  constructor (name) {
    this.name = name;

    this.players = {};
    this.sockets = {};
    this.rateLimitExceeded = new Set();
    this.timer = {
      interval: null,
      timeRemaining: 0
    };
  }

  connection (socket, userId, username) {
    console.log(`Connection in room ${HEADER}${this.name}${ENDC} - userId: ${OKBLUE}${userId}${ENDC}, username: ${OKBLUE}${username}${ENDC} - with settings ${OKGREEN}${Object.keys(this.settings).map(key => [key, this.settings[key]].join(': ')).join('; ')};${ENDC}`);

    const isNew = !(userId in this.players);
    if (isNew) { this.players[userId] = new Player(userId); }
    this.players[userId].online = true;
    this.sockets[userId] = socket;
    username = this.players[userId].updateUsername(username);

    socket.on('message', message => {
      if (rateLimiter(socket) && !this.rateLimitExceeded.has(username)) {
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
    this.connection2(socket, userId, username, isNew);
  }

  connection2 (socket, userId, username, isNew) { throw new Error('Not implemented'); }
  close (userId) { throw new Error('Not implemented'); }
  async message (userId, message) { throw new Error('Not implemented'); }

  /**
   * Sends a message to all sockets
   * @param {{}} message
   */
  emitMessage (message) {
    message = JSON.stringify(message);
    for (const socket of Object.values(this.sockets)) {
      socket.send(message);
    }
  }

  /**
   * Sends a message to a socket at a specific userId
   * @param {string} userId
   * @param {{}} message
   */
  sendToSocket (userId, message) {
    message = JSON.stringify(message);
    this.sockets[userId].send(message);
  }

  /**
   * @param {number} time - time in ticks, where 10 ticks = 1 second
   * @param {(time: number) => void} ontick - called every tick
   * @param {() => void} callback - called when timer is up
   * @returns {void}
   */
  startServerTimer (time, ontick, callback) {
    clearInterval(this.timer.interval);
    this.timer.timeRemaining = time;

    this.timer.interval = setInterval(() => {
      if (this.timer.timeRemaining <= 0) {
        clearInterval(this.timer.interval);
        callback();
      }
      ontick(this.timer.timeRemaining);
      this.timer.timeRemaining--;
    }, 100);
  }
}
