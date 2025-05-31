import account from '../accounts.js';

export default class star {
  static starredSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
    </svg>`;

  static unstarredSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
      <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
    </svg>`;

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

  static async clearStarredTossups () {
    const response = await fetch('/auth/stars/clear-tossup-stars', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      window.alert('There was an error clearing starred tossups.');
    }

    const { count } = await response.json();
    if (count) {
      window.alert(`Cleared ${count} starred tossups.`);
    }
  }

  static async clearStarredBonuses () {
    const response = await fetch('/auth/stars/clear-bonus-stars', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      window.alert('There was an error clearing starred bonuses.');
    }

    const { count } = await response.json();
    if (count) {
      window.alert(`Cleared ${count} starred bonuses.`);
    }
  }
}
