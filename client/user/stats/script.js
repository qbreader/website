import api from '../../api/index.js';

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
  const set_name_input = document.getElementById('set-name');
  set_name_input.addEventListener('input', function () {
    document.getElementById('set-dropdown')?.remove();
    const set = this.value.toLowerCase();
    const dropdown_items = SET_LIST.filter(setName =>
      setName.toLowerCase().includes(set))
      .map(setName => `<a class="dropdown-item" onclick="fillSetName(event)">${setName}</a>`)
      .join('');
    const dropdown_html = dropdown_items === ''
      ? ''
      : `
        <div id="set-dropdown" class="dropdown-menu" style="display: inline" aria-labelledby="set-name">
            ${dropdown_items}
        </div>
        `;
    set_name_input.insertAdjacentHTML('afterend', dropdown_html);
  });
  set_name_input.addEventListener('blur', removeDropdown);
}

document.getElementById('set-name').addEventListener('change', async function () {
  // make border red if set name is not in set list
  if (SET_LIST.includes(this.value) || this.value.length === 0) {
    this.classList.remove('is-invalid');
  } else {
    this.classList.add('is-invalid');
  }
});
