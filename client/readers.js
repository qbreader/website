/**
 * Event listeners for pages that read questions to the user,
 * and retrieval of `SET_LIST`.
 */

document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});

if (localStorage.getItem('font-size')) {
    document.getElementById('question').style.setProperty('font-size', `${localStorage.getItem('font-size')}px`);
}

if (localStorage.getItem('high-contrast-question-text') === 'true') {
    document.getElementById('question').classList.add('high-contrast-question-text');
}

const SET_LIST = [];

fetch('/api/set-list')
    .then(response => response.json())
    .then(data => data.setList)
    .then(data => {
        document.getElementById('set-list').innerHTML = data.map(setName => `<option>${setName}</option>`).join('');
        data.forEach(setName => {
            SET_LIST.push(setName);
        });
    });

function fillSetName(event) {
    const setNameInput = document.getElementById('set-name');
    const name = event.target.innerHTML;
    setNameInput.value = name;
    setNameInput.focus();
}

function removeDropdown() {
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
        const dropdown_html = dropdown_items === '' ? '' : `
        <div id="set-dropdown" class="dropdown-menu" style="display: inline" aria-labelledby="set-name">
            ${dropdown_items}
        </div>
        `;
        set_name_input.insertAdjacentHTML('afterend', dropdown_html);
    });
    set_name_input.addEventListener('blur', removeDropdown);
}

const soundEffects = localStorage.getItem('sound-effects') === 'true';
const buzzAudio = new Audio('/audio/buzz.mp3');
const correctAudio = new Audio('/audio/correct.mp3');
const incorrectAudio = new Audio('/audio/incorrect.mp3');
