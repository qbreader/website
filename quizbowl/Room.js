export default class Room {
  /**
   * @param {string} name - The name of the room
   */
  constructor (name) {
    this.name = name;

    this.players = {};
    this.sockets = {};
    this.timer = {
      interval: null,
      timeRemaining: 0
    };
  }

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
