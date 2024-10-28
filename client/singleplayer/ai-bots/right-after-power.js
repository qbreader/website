import AIBot from '../AIBot.js';

export default class RightAfterPowerAIBot extends AIBot {
  constructor (room) {
    const name = 'right-after-power';
    super(room, name);
  }

  next ({ packetLength, oldTossup, tossup }) {
    super.next({ packetLength, oldTossup, tossup });
    this.buzzpoint = this.tossup.question_sanitized.split(' ').indexOf('(*)');
    if (this.buzzpoint === -1) {
      this.buzzpoint = this.tossup.question_sanitized.split(' ').length / 2;
      this.buzzpoint = Math.floor(this.buzzpoint);
    }
  }

  updateQuestion ({ word }) {
    super.updateQuestion({ word });
    if (this.wordIndex === this.buzzpoint) {
      this.sendBuzz({ correct: true });
    }
  }
}
