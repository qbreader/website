import account from '../accounts.js';

export default class star {
  static async starBonus (bonusId) {
    return fetch('/auth/stars/star-bonus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus_id: bonusId })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        window.alert('There was an error starring the bonus.');
      }
      return response.ok;
    }).catch(_error => {
      window.alert('There was an error starring the bonus.');
      return false;
    });
  }

  static async starTossup (tossupId) {
    return fetch('/auth/stars/star-tossup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tossup_id: tossupId })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        window.alert('There was an error starring the bonus.');
      }
      return response.ok;
    }).catch(_error => {
      window.alert('There was an error starring the bonus.');
      return false;
    });
  }

  static async unstarBonus (bonusId) {
    return fetch('/auth/stars/unstar-bonus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus_id: bonusId })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        window.alert('There was an error unstarring the bonus.');
      }
      return response.ok;
    }).catch(_error => {
      window.alert('There was an error unstarring the bonus.');
      return false;
    });
  }

  static async unstarTossup (tossupId) {
    return fetch('/auth/stars/unstar-tossup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tossup_id: tossupId })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        window.alert('There was an error unstarring the bonus.');
      }
      return response.ok;
    }).catch(_error => {
      window.alert('There was an error unstarring the bonus.');
      return false;
    });
  }

  static async isStarredBonus (bonusId) {
    if (!(await account.getUsername())) {
      return false;
    }

    return await fetch(`/auth/stars/is-starred-bonus?bonus_id=${bonusId}`)
      .then(response => response.json())
      .then(response => response.isStarred)
      .catch(_error => {
        // window.alert('There was an error checking if the bonus is starred.');
        return false;
      });
  }

  static async isStarredTossup (tossupId) {
    if (!(await account.getUsername())) {
      return false;
    }

    return await fetch(`/auth/stars/is-starred-tossup?tossup_id=${tossupId}`)
      .then(response => response.json())
      .then(response => response.isStarred)
      .catch(_error => {
        // window.alert('There was an error checking if the tossup is starred.');
        return false;
      });
  }

  static async getStarredTossups () {
    return await fetch('/auth/stars/tossups')
      .then(response => response.json())
      .then(tossups => tossups);
  }

  static async getStarredBonuses () {
    return await fetch('/auth/stars/bonuses')
      .then(response => response.json())
      .then(bonuses => bonuses);
  }

  static async getStarredTossupIds () {
    if (!(await account.getUsername())) {
      return [];
    }

    return await fetch('/auth/stars/tossup-ids')
      .then(response => response.json())
      .then(ids => ids);
  }

  static async getStarredBonusIds () {
    if (!(await account.getUsername())) {
      return [];
    }

    return await fetch('/auth/stars/bonus-ids')
      .then(response => response.json())
      .then(ids => ids);
  }
}
