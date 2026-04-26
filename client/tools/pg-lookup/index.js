import sortTable from '../../scripts/utilities/tables.js';

const form = document.getElementById('form');
const wordInput = document.getElementById('word-input');
const resultsContainer = document.getElementById('results-container');
const resultsSummary = document.getElementById('results-summary');
const noResults = document.getElementById('no-results');

const params = new URLSearchParams(window.location.search);
if (params.get('word')) {
  wordInput.value = params.get('word');
  search(params.get('word'));
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const word = wordInput.value.trim();
  if (!word) { return; }
  const url = new URL(window.location.href);
  url.searchParams.set('word', word);
  window.history.replaceState({}, '', url);
  search(word);
});

document.getElementById('table').querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index, false, 'tbody', 0, 0));
});

/**
 * Creates a table row for a pronunciation guide result.
 * @param {string} pg - The pronunciation guide text.
 * @param {object} question - The source question object.
 * @param {'tossup'|'bonus'} type - The question type.
 * @returns {HTMLTableRowElement}
 */
function createResultRow ({ pg, question, type }) {
  const row = document.getElementById('tbody').insertRow();
  row.insertCell().textContent = pg;
  row.insertCell().textContent = question.set.name;
  row.insertCell().textContent = type;
  row.insertCell().textContent = `${question.category} / ${question.subcategory}` + (question.alternate_subcategory ? ` / ${question.alternate_subcategory}` : '');

  const a = document.createElement('a');
  a.href = `/db/${type}/?_id=${question._id}`;
  a.textContent = 'View';

  row.insertCell().appendChild(a);
  return row;
}

async function search (word) {
  resultsContainer.classList.add('d-none');
  noResults.classList.add('d-none');
  document.getElementById('spinner').classList.remove('d-none');

  try {
    const response = await fetch('/api/pg-lookup?' + new URLSearchParams({ word }));
    if (!response.ok) {
      window.alert('An error occurred while searching. Please try again.');
      return;
    }

    const { tossups, bonuses } = await response.json();
    const totalCount = tossups.length + bonuses.length;

    if (totalCount === 0) {
      noResults.classList.remove('d-none');
      return;
    }

    resultsSummary.textContent = `Found ${totalCount} result${totalCount === 1 ? '' : 's'} for ${word}:`;
    document.getElementById('tbody').innerHTML = '';
    tossups.forEach(tossup => createResultRow({ pg: tossup.pg, question: tossup, type: 'tossup' }));
    bonuses.forEach(bonus => createResultRow({ pg: bonus.pg, question: bonus, type: 'bonus' }));
    resultsContainer.classList.remove('d-none');
  } catch (err) {
    window.alert('An error occurred while searching. Please try again.');
    throw err;
  } finally {
    document.getElementById('spinner').classList.add('d-none');
  }
}
