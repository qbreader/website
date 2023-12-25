function titleCase(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const subcategory = titleCase(window.location.pathname.split('/').at(-1));
document.getElementById('subcategory-name').textContent = subcategory;

fetch(`/api/frequency-list?subcategory=${subcategory}`)
    .then(response => response.json())
    .then(response => {
        const { frequencyList } = response;
        const table = document.getElementById('frequency-list');

        for (const index in frequencyList) {
            const { answer, count } = frequencyList[index];
            const row = table.insertRow();
            row.insertCell().textContent = parseInt(index) + 1;
            row.insertCell().textContent = answer;
            row.insertCell().textContent = count;
        }

        document.getElementsByClassName('spinner-border')[0].remove();
    });
