import account from '../accounts.js';

export default class questionStats {
  /**
   *
   * @param {string} _id - The bonus id
   * @param {number[]} pointsPerPart - How many points were scored on each part of the bonus
   * @returns
   */
  static async recordBonus (_id, pointsPerPart) {
    if (!(await account.getUsername())) {
      return;
    }

    fetch('/auth/question-stats/record-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id, pointsPerPart })
    }).then(response => {
      if (response.status === 401) {
        account.deleteUsername();
        throw new Error('Unauthenticated');
      }
    });
  }

  static async recordTossup ({ _id, celerity, isCorrect, multiplayer, pointValue }) {
    if (!(await account.getUsername())) {
      return;
    }

    fetch('/auth/question-stats/record-tossup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id, isCorrect, pointValue, celerity, multiplayer })
    }).then(response => {
      if (response.status === 401) {
        account.deleteUsername();
        throw new Error('Unauthenticated');
      }
    });
  }
}
