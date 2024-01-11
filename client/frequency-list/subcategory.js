function titleCase(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const subcategory = titleCase(window.location.pathname.split('/').at(-1));
document.getElementById('subcategory-name').textContent = subcategory;

function updateFrequencyListDisplay(level) {
    const table = document.getElementById('frequency-list');
    table.innerHTML = '';
    document.getElementsByClassName('spinner-border')[0].classList.remove('d-none');

    fetch('/api/frequency-list?' + new URLSearchParams({ subcategory, level }))
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

updateFrequencyListDisplay('all');

document.getElementById('level-select').addEventListener('change', event => {
    updateFrequencyListDisplay(event.target.value);
});
