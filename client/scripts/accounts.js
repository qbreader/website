export default class account {
  static deleteUsername () {
    window.sessionStorage.setItem('account-username', JSON.stringify({ username: null }));
    document.getElementById('login-link').textContent = 'Log in';
    document.getElementById('login-link').href = '/user/login';
  }

  static async getUsername () {
    const data = window.sessionStorage.getItem('account-username');
    if (data !== null) { return JSON.parse(data).username; }
    const username = await fetch('/auth/get-username').then(response => {
      if (response.status === 401) { return { username: null }; }
      return response.json();
    }).then(json => json.username);
    window.sessionStorage.setItem('account-username', JSON.stringify({ username }));
    return username;
  }

  static setUsername (username, expires) {
    window.sessionStorage.setItem('account-username', JSON.stringify({ username, expires }));
  }
}
