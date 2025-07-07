import getSetList from '../../scripts/api/get-set-list.js';

const SET_LIST = await getSetList();
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

document.getElementById('set-name').addEventListener('change', async function () {
  // make border red if set name is not in set list
  if (SET_LIST.includes(this.value) || this.value.length === 0) {
    this.classList.remove('is-invalid');
  } else {
    this.classList.add('is-invalid');
  }
});
