import account from './accounts.js';

const username = await account.getUsername();
if (username) {
    document.getElementById('welcome-username').textContent = `, ${username}`;
}
