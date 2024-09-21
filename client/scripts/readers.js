import account from './accounts.js';
import api from './api/index.js';

/**
 * Event listeners for pages that read questions to the user,
 * and retrieval of `SET_LIST`.
 */

if (window.localStorage.getItem('font-size')) {
  document.getElementById('question').style.setProperty('font-size', `${window.localStorage.getItem('font-size')}px`);
}

if (window.localStorage.getItem('high-contrast-question-text') === 'true') {
  document.getElementById('question').classList.add('high-contrast-question-text');
}

const SET_LIST = api.getSetList();
document.getElementById('set-list').innerHTML = SET_LIST.map(setName => `<option>${setName}</option>`).join('');

// eslint-disable-next-line no-unused-vars
function fillSetName (event) {
  const setNameInput = document.getElementById('set-name');
  const name = event.target.innerHTML;
  setNameInput.value = name;
  setNameInput.focus();
}

function removeDropdown () {
  document.getElementById('set-dropdown')?.remove();
}

if (window.navigator.userAgent.match(/Mobile.*Firefox/)) {
  const setNameInput = document.getElementById('set-name');
  setNameInput.addEventListener('input', function () {
    document.getElementById('set-dropdown')?.remove();
    const set = this.value.toLowerCase();
    const dropdownItems = SET_LIST
      .filter(setName => setName.toLowerCase().includes(set))
      .map(setName => `<a class="dropdown-item" onclick="fillSetName(event)">${setName}</a>`)
      .join('');
    const dropdownHtml = dropdownItems === ''
      ? ''
      : `
        <div id="set-dropdown" class="dropdown-menu" style="display: inline" aria-labelledby="set-name">
            ${dropdownItems}
        </div>
        `;
    setNameInput.insertAdjacentHTML('afterend', dropdownHtml);
  });
  setNameInput.addEventListener('blur', removeDropdown);
}

const banners = {};

account.getUsername().then(username => {
  const toast = new bootstrap.Toast(document.getElementById('funny-toast'));
  const toastText = document.getElementById('funny-toast-text');

  if (username in banners) {
    toastText.textContent = banners[username];
    toast.show();
  }
});
