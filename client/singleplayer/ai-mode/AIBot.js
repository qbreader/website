import Player from '../../../quizbowl/Player.js';

export default class AIBot {
  constructor (room, name = 'ai-bot') {
    this.room = room;
    this.player = new Player(name);
    this.player.username = name;
    this.socket = {
      send: this.onmessage.bind(this),
      sendToServer: (message) => room.message(name, message)
    };
    this.active = true;

    this.tossup = {};
    this.wordIndex = 0;
  }

  onmessage (message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'start':
      case 'skip':
      case 'next': return this.next(data);

      case 'update-question': return this.updateQuestion(data);
    }
  }

  get active () {
    return this._active;
  }

  set active (value) {
    this._active = value;
    if (this._active) {
      this.room.players[this.player.userId] = this.player;
      this.room.sockets[this.player.userId] = this.socket;
    } else {
      this.room.leave(this.player.userId);
    }
  }

  sendBuzz ({ correct }) {
    if (!this.active) { return; }
    // need to wait 50ms before each action
    // otherwise the server will not process things correctly
    setTimeout(
      () => {
        this.socket.sendToServer({ type: 'buzz' });
        setTimeout(
          () => this.socket.sendToServer({ type: 'give-answer', givenAnswer: correct ? this.tossup.answer_sanitized : '' }),
          1000
        );
      }, 50
    );
  }

  /**
   * Calculate when to buzz
   * @returns {{buzzpoint: number, correctBuzz: boolean}}
   */
  calculateBuzzpoint ({ packetLength, oldTossup, tossup }) {
    throw new Error('calculateBuzzpoint not implemented');
  }

  next ({ packetLength, oldTossup, tossup }) {
    this.tossup = tossup;
    this.wordIndex = 0;
    ({ buzzpoint: this.buzzpoint, correctBuzz: this.correctBuzz } = this.calculateBuzzpoint({ packetLength, oldTossup, tossup }));
  }

  /**
   *
   * @param {({ packetLength, oldTossup, tossup }) => {buzzpoint: number, correctBuzz: boolean}} calculateBuzzpointFunction
   */
  setAIBot (calculateBuzzpointFunction) {
    this.calculateBuzzpoint = calculateBuzzpointFunction;
  }

  updateQuestion ({ word }) {
    if (word !== '(#)') { this.wordIndex++; }
    if (this.wordIndex === this.buzzpoint) {
      return this.sendBuzz({ correct: this.correctBuzz });
    }
  }
}
