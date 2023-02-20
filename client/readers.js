/**
 * Event listeners for pages that read questions to the user,
 * and retrieval of `SET_LIST`.
 */

document.getElementById('font-size').addEventListener('input', function () {
    localStorage.setItem('font-size', this.value);
    document.getElementById('font-size-display').innerHTML = this.value;
    document.getElementById('question').style.setProperty('font-size', `${this.value}px`);
});

document.getElementById('report-question-submit').addEventListener('click', function () {
    reportQuestion(
        document.getElementById('report-question-id').value,
        document.getElementById('report-question-reason').value,
        document.getElementById('report-question-description').value
    );
});

document.getElementById('toggle-high-contrast-question-text').addEventListener('click', function () {
    this.blur();
    if (this.checked) {
        document.getElementById('question').classList.add('high-contrast-question-text');
        localStorage.setItem('high-contrast-question-text', 'true');
    } else {
        document.getElementById('question').classList.remove('high-contrast-question-text');
        localStorage.removeItem('high-contrast-question-text');
    }
});

document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});

if (localStorage.getItem('font-size')) {
    document.getElementById('font-size').value = localStorage.getItem('font-size');
    document.getElementById('font-size-display').innerHTML = localStorage.getItem('font-size');
    document.getElementById('question').style.setProperty('font-size', `${localStorage.getItem('font-size')}px`);
}

if (localStorage.getItem('high-contrast-question-text') === 'true') {
    document.getElementById('toggle-high-contrast-question-text').checked = true;
    document.getElementById('question').classList.add('high-contrast-question-text');
}

const SET_LIST = [];

fetch('/api/set-list')
    .then(response => response.json())
    .then(data => {
        document.getElementById('set-list').innerHTML = data.map(setName => `<option>${setName}</option>`).join('');
        data.forEach(setName => {
            SET_LIST.push(setName);
        });
    });
