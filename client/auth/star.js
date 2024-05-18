import account from '../accounts.js';

export default class star {
  static async starBonus (bonus_id) {
    return fetch('/auth/stars/star-bonus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus_id })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        alert('There was an error starring the bonus.');
      }
      return response.ok;
    }).catch(_error => {
      alert('There was an error starring the bonus.');
      return false;
    });
  }

  static async starTossup (tossup_id) {
    return fetch('/auth/stars/star-tossup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tossup_id })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        alert('There was an error starring the bonus.');
      }
      return response.ok;
    }).catch(_error => {
      alert('There was an error starring the bonus.');
      return false;
    });
  }

  static unstarBonus (bonus_id) {
    fetch('/auth/stars/unstar-bonus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus_id })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        alert('There was an error unstarring the bonus.');
      }
    }).catch(_error => {
      alert('There was an error unstarring the bonus.');
    });
  }

  static unstarTossup (tossup_id) {
    fetch('/auth/stars/unstar-tossup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tossup_id })
    }).then(response => {
      if (response.status === 401) {
        const toast = new bootstrap.Toast(document.getElementById('star-toast'));
        toast.show();
      } else if (!response.ok) {
        alert('There was an error unstarring the bonus.');
      }
    }).catch(_error => {
      alert('There was an error unstarring the bonus.');
    });
  }

  static async isStarredBonus (bonus_id) {
    if (!(await account.getUsername())) {
      return false;
    }

    return await fetch(`/auth/stars/is-starred-bonus?bonus_id=${bonus_id}`)
      .then(response => response.json())
      .then(response => response.isStarred);
  }

  static async isStarredTossup (tossup_id) {
    if (!(await account.getUsername())) {
      return false;
    }

    return await fetch(`/auth/stars/is-starred-tossup?tossup_id=${tossup_id}`)
      .then(response => response.json())
      .then(response => response.isStarred);
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
}
