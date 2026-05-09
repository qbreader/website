const form = document.getElementById('form');
const wordInput = document.getElementById('word-input');
const resultsContainer = document.getElementById('results-container');
const resultsSummary = document.getElementById('results-summary');
const noResults = document.getElementById('no-results');
const tbody = document.getElementById('tbody');

let currentWord = '';
let currentResults = [];

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

/**
 * @param {object} source
 * @param {string} source.pg
 * @param {object} source.question
 * @param {'tossup'|'bonus'} source.type
 * @returns {boolean}
 */
function passesFilters ({ question }) {
  const standardOnly = document.getElementById('toggle-standard-only').checked;
  if (standardOnly && !question.set.standard) { return false; }
  const excludeMSHS = document.getElementById('toggle-exclude-ms-hs').checked;
  if (excludeMSHS && question.difficulty <= 5) { return false; }
  return true;
}

/**
 * Creates a table row for a grouped pronunciation guide result.
 * @param {string} pg - The pronunciation guide text.
 * @param {Array<{question: object, type: 'tossup'|'bonus'}>} sources
 * @returns {HTMLTableRowElement}
 */
function createResultRow ({ pg, sources }) {
  const row = tbody.insertRow();
  row.insertCell().textContent = pg;

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = `${sources.length} source${sources.length === 1 ? '' : 's'}`;
  details.appendChild(summary);

  const sourceTable = document.createElement('table');
  sourceTable.classList.add('table', 'table-sm', 'mt-2', 'mb-0');
  sourceTable.setAttribute('aria-label', 'Pronunciation guide source rows');
  const sourceThead = sourceTable.createTHead();
  const headerRow = sourceThead.insertRow();
  ['Set', 'Type', 'Difficulty', 'Category', 'Link'].forEach(text => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  const sourceTbody = document.createElement('tbody');

  sources.forEach(({ question, type }) => {
    const sourceRow = sourceTbody.insertRow();
    const a = document.createElement('a');
    a.href = `/db/${type}/?_id=${question._id}`;
    a.textContent = question.set.name;
    sourceRow.insertCell().appendChild(a);
    const cell1 = sourceRow.insertCell();
    cell1.textContent = type;
    cell1.className = 'd-none d-md-table-cell';
    const cell2 = sourceRow.insertCell();
    cell2.textContent = `${question.category} / ${question.subcategory}${question.alternate_subcategory ? ` / ${question.alternate_subcategory}` : ''}`;
    cell2.className = 'd-none d-lg-table-cell';
  });

  sourceTable.appendChild(sourceTbody);
  details.appendChild(sourceTable);
  row.insertCell().appendChild(details);
  return row;
}

function renderResults () {
  tbody.innerHTML = '';
  const filteredResults = currentResults.filter(passesFilters);

  if (filteredResults.length === 0) {
    resultsContainer.classList.add('d-none');
    noResults.classList.remove('d-none');
    return;
  }

  const grouped = new Map();
  filteredResults.forEach(result => {
    const existing = grouped.get(result.pg);
    if (existing) {
      existing.sources.push({ question: result.question, type: result.type });
      return;
    }
    grouped.set(result.pg, { pg: result.pg, sources: [{ question: result.question, type: result.type }] });
  });

  const groupedResults = [...grouped.values()]
    .sort((a, b) => b.sources.length - a.sources.length || a.pg.localeCompare(b.pg));

  // within each group, sort sources by year (newest to oldest) then by set name
  groupedResults.forEach(group => {
    group.sources.sort((a, b) => b.question.set.year - a.question.set.year || a.question.set.name.localeCompare(b.question.set.name));
  });

  resultsSummary.textContent = `Found ${filteredResults.length} result${filteredResults.length === 1 ? '' : 's'} across ${groupedResults.length} pronunciation guide${groupedResults.length === 1 ? '' : 's'} for ${currentWord}:`;
  groupedResults.forEach(createResultRow);
  resultsContainer.classList.remove('d-none');
  noResults.classList.add('d-none');
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
    const allResults = [
      ...tossups.map(tossup => ({ pg: tossup.pg, question: tossup, type: 'tossup' })),
      ...bonuses.map(bonus => ({ pg: bonus.pg, question: bonus, type: 'bonus' }))
    ];
    const totalCount = allResults.length;

    if (totalCount === 0) {
      noResults.classList.remove('d-none');
      return;
    }

    currentWord = word;
    currentResults = allResults;
    renderResults();
  } catch (err) {
    window.alert('An error occurred while searching. Please try again.');
    throw err;
  } finally {
    document.getElementById('spinner').classList.add('d-none');
  }
}

document.getElementById('toggle-standard-only').addEventListener('change', renderResults);
document.getElementById('toggle-exclude-ms-hs').addEventListener('change', renderResults);
