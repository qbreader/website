import { USERNAME_MAX_LENGTH } from '../server/multiplayer/constants.js';

class Player {
  constructor (userId) {
    this.userId = userId;

    this.username = '';

    this.powers = 0;
    this.tens = 0;
    this.zeroes = 0;
    this.negs = 0;
    this.points = 0;
    this.tuh = 0;
    this.celerity = {
      all: {
        total: 0,
        average: 0
      },
      correct: {
        total: 0,
        average: 0
      }
    };
  }

  clearStats () {
    this.powers = 0;
    this.tens = 0;
    this.zeroes = 0;
    this.negs = 0;
    this.points = 0;
    this.tuh = 0;
    this.celerity = {
      all: {
        total: 0,
        average: 0
      },
      correct: {
        total: 0,
        average: 0
      }
    };
  }

  updateStats (points, celerity) {
    this.points += points;
    this.celerity.all.total += celerity;
    this.celerity.all.average = this.celerity.all.total / this.tuh;

    if (points > 10) {
      this.powers++;
    } else if (points === 10) {
      this.tens++;
    } else if (points === 0) {
      this.zeroes++;
    } else if (points < 0) {
      this.negs++;
    }

    if (points > 0) {
      this.celerity.correct.total += celerity;
      this.celerity.correct.average = this.celerity.correct.total / (this.powers + this.tens);
    }
  }

  /**
   * Safely update the player's username, and return the new username.
   * @param {string} username
   * @param {number} [maxLength=USERNAME_MAX_LENGTH]
   * @returns {string} newUsername
   */
  safelySetUsername (username, maxLength = USERNAME_MAX_LENGTH) {
    if (!username) { username = ''; }
    username = username.substring(0, maxLength);
    this.username = username;
    return this.username;
  }
}

export default Player;
