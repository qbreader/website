export default class Room {
  /**
   * @param {string} name - The name of the room
   */
  constructor (name) {
    this.name = name;

    this.players = {};
    this.sockets = {};
    this.teams = {};
    this.timer = {
      interval: null,
      timeRemaining: 0
    };
  }

  async message (userId, message) {
    switch (message.type) {
      case 'clear-stats': return this.clearStats(userId, message);
    }
  }

  clearStats (userId) {
    this.players[userId].clearStats();
    this.emitMessage({ type: 'clear-stats', userId });
  }

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

  leave (userId) {
    // this.deletePlayer(userId);
    this.players[userId].online = false;
    delete this.sockets[userId];
    const username = this.players[userId].username;
    this.emitMessage({ type: 'leave', userId, username });
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

  setUsername (userId, { username }) {
    if (typeof username !== 'string') { return false; }
    const oldUsername = this.players[userId].username;
    this.players[userId].username = username;
    this.emitMessage({ type: 'set-username', userId, oldUsername, newUsername: username });
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
