let level = 'all';
let limit = 100;
const subcategory = titleCase(window.location.pathname.split('/').at(-1));

function titleCase(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateFrequencyListDisplay(level, limit) {
    const table = document.getElementById('frequency-list');
    table.innerHTML = '';

    document.getElementById('limit').textContent = limit;
    document.getElementsByClassName('spinner-border')[0].classList.remove('d-none');

    fetch('/api/frequency-list?' + new URLSearchParams({ subcategory, level, limit }))
        .then(response => response.json())
        .then(response => {
            const { frequencyList } = response;

            for (const index in frequencyList) {
                const { answer, count } = frequencyList[index];
                const row = table.insertRow();
                row.insertCell().textContent = parseInt(index) + 1;
                row.insertCell().textContent = answer;
                row.insertCell().textContent = count;
            }

            document.getElementsByClassName('spinner-border')[0].classList.add('d-none');
        });
}

document.getElementById('level-select').addEventListener('change', event => {
    level = event.target.value;
    updateFrequencyListDisplay(level, limit);
});

document.getElementById('limit-select').addEventListener('change', event => {
    limit = event.target.value;
    updateFrequencyListDisplay(level, limit);
});

document.getElementById('subcategory-name').textContent = subcategory;
updateFrequencyListDisplay(level, limit);
