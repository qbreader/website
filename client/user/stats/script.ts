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


function getDifficulties() {
    const difficulties = [];
    Array.from(document.getElementById('difficulties').children).forEach(li => {
        const input = li.querySelector('input');
        if (input.checked) {
            difficulties.push(parseInt(input.value));
        }
    });
    return difficulties;
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


document.getElementById('set-name').addEventListener('change', async function () {
    // make border red if set name is not in set list
    if (SET_LIST.includes(this.value) || this.value.length === 0) {
        this.classList.remove('is-invalid');
    } else {
        this.classList.add('is-invalid');
    }
});
