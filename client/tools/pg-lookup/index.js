const form = document.getElementById('form');
const wordInput = document.getElementById('word-input');
const resultsContainer = document.getElementById('results-container');
const resultsSummary = document.getElementById('results-summary');
const noResults = document.getElementById('no-results');
const tbody = document.getElementById('tbody');
const setNameFilterInput = document.getElementById('set-name-filter');
const minDifficultyFilterInput = document.getElementById('min-difficulty-filter');
const maxDifficultyFilterInput = document.getElementById('max-difficulty-filter');

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

setNameFilterInput.addEventListener('input', renderResults);
minDifficultyFilterInput.addEventListener('input', renderResults);
maxDifficultyFilterInput.addEventListener('input', renderResults);

/**
 * @param {object} source
 * @param {string} source.pg
 * @param {object} source.question
 * @param {'tossup'|'bonus'} source.type
 * @returns {boolean}
 */
function passesFilters ({ question }) {
  const setNameFilter = setNameFilterInput.value.trim().toLowerCase();
  if (setNameFilter && !question.set.name.toLowerCase().includes(setNameFilter)) {
    return false;
  }

  const minDifficulty = minDifficultyFilterInput.value.trim() === ''
    ? null
    : Number(minDifficultyFilterInput.value);
  const maxDifficulty = maxDifficultyFilterInput.value.trim() === ''
    ? null
    : Number(maxDifficultyFilterInput.value);

  if (Number.isFinite(minDifficulty) && question.difficulty < minDifficulty) {
    return false;
  }
  if (Number.isFinite(maxDifficulty) && question.difficulty > maxDifficulty) {
    return false;
  }

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
  row.insertCell().textContent = String(sources.length);

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = `${sources.length} source${sources.length === 1 ? '' : 's'}`;
  details.appendChild(summary);

  const sourceList = document.createElement('div');
  sourceList.classList.add('mt-2');

  sources.forEach(({ question, type }) => {
    const sourceLine = document.createElement('div');
    sourceLine.classList.add('mb-2');
    sourceLine.textContent = `${question.set.name} | ${type} | difficulty ${question.difficulty} | ${question.category} / ${question.subcategory}${question.alternate_subcategory ? ` / ${question.alternate_subcategory}` : ''} `;

    const a = document.createElement('a');
    a.href = `/db/${type}/?_id=${question._id}`;
    a.textContent = 'View';
    sourceLine.appendChild(a);
    sourceList.appendChild(sourceLine);
  });

  details.appendChild(sourceList);
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
