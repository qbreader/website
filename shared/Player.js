class Player {
  constructor (userId, MAX_USERNAME_LENGTH = undefined) {
    this.userId = userId;
    this.MAX_USERNAME_LENGTH = MAX_USERNAME_LENGTH;

    this.teamId = undefined;
    this.username = '';
    this.buzzes = 0;
    this.superpowers = 0;
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
    this.buzzes = 0;
    this.powers = 0;
    this.superpowers = 0;
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

    if (points === 20) {
      this.superpowers++;
    } else if (points === 15) {
      this.powers++;
    } else if (points === 10) {
      this.tens++;
    } else if (points === 0) {
      this.zeroes++;
    } else if (points < 0) {
      this.negs++;
    }

    if (points > 0) {
      const correctBuzzes = this.superpowers + this.powers + this.tens;
      this.celerity.correct.total += celerity;
      this.celerity.correct.average = this.celerity.correct.total / correctBuzzes;
    }
  }

  /**
   * Returns true if the player has recorded any stats or buzzes.
   * @returns {boolean}
   */
  hasActivity () {
    return this.tuh > 0 || this.buzzes > 0 || this.powers > 0 || this.tens > 0 || this.zeroes > 0 || this.negs > 0 || this.superpowers > 0;
  }

  /**
   * Safely update the player's username, and return the new username.
   * @param {string} username
   * @returns {string} newUsername
   */
  safelySetUsername (username) {
    if (!username) { username = ''; }
    username = username.substring(0, this.MAX_USERNAME_LENGTH);
    this.username = username;
    return this.username;
  }
}

export default Player;
