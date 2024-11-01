import account from '../accounts.js';

export default class questionStats {
  static async recordBonus (bonus, pointsPerPart) {
    if (!(await account.getUsername())) {
      return;
    }

    fetch('/auth/question-stats/record-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus, pointsPerPart })
    }).then(response => {
      if (response.status === 401) {
        account.deleteUsername();
        throw new Error('Unauthenticated');
      }
    });
  }

  static async recordTossup (tossup, isCorrect, pointValue, celerity, multiplayer) {
    if (!(await account.getUsername())) {
      return;
    }

    fetch('/auth/question-stats/record-tossup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tossup, isCorrect, pointValue, celerity, multiplayer })
    }).then(response => {
      if (response.status === 401) {
        account.deleteUsername();
        throw new Error('Unauthenticated');
      }
    });
  }
}
