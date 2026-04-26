const form = document.getElementById('form');
const wordInput = document.getElementById('word-input');
const resultsContainer = document.getElementById('results-container');
const resultsSummary = document.getElementById('results-summary');
const tossupResults = document.getElementById('tossup-results');
const bonusResults = document.getElementById('bonus-results');
const noResults = document.getElementById('no-results');
const loading = document.getElementById('loading');

// Pre-fill from URL params
const params = new URLSearchParams(window.location.search);
if (params.get('word')) {
  wordInput.value = params.get('word');
  search(params.get('word'));
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const word = wordInput.value.trim();
  if (!word) return;
  const url = new URL(window.location.href);
  url.searchParams.set('word', word);
  window.history.replaceState({}, '', url);
  search(word);
});

/**
 * Creates a table row for a pronunciation guide result.
 * @param {string} pg - The pronunciation guide text.
 * @param {object} question - The source question object.
 * @param {'tossup'|'bonus'} type - The question type.
 * @returns {HTMLTableRowElement}
 */
function createResultRow (pg, question, type) {
  const tr = document.createElement('tr');

  const pgTd = document.createElement('td');
  pgTd.textContent = `\u201C${pg}\u201D`;
  tr.appendChild(pgTd);

  const setTd = document.createElement('td');
  setTd.textContent = question.set.name;
  tr.appendChild(setTd);

  const packetTd = document.createElement('td');
  packetTd.textContent = question.packet.number;
  tr.appendChild(packetTd);

  const numTd = document.createElement('td');
  numTd.textContent = `Q${question.number}`;
  tr.appendChild(numTd);

  const catTd = document.createElement('td');
  catTd.textContent = `${question.category} / ${question.subcategory}`;
  tr.appendChild(catTd);

  const linkTd = document.createElement('td');
  const a = document.createElement('a');
  a.href = `/db/${type}/?_id=${question._id}`;
  a.target = '_blank';
  a.textContent = 'View';
  linkTd.appendChild(a);
  tr.appendChild(linkTd);

  return tr;
}

/**
 * Creates a results table for a list of questions.
 * @param {object[]} questions - Array of question objects with `pronunciationGuides` property.
 * @param {'tossup'|'bonus'} type - The question type.
 * @returns {HTMLElement}
 */
function createResultsTable (questions, type) {
  const container = document.createElement('div');

  const heading = document.createElement('h5');
  heading.textContent = type === 'tossup' ? 'Tossups' : 'Bonuses';
  container.appendChild(heading);

  if (questions.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = `No ${type} results.`;
    container.appendChild(p);
    return container;
  }

  const table = document.createElement('table');
  table.className = 'table table-striped table-hover table-sm';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Pronunciation Guide</th>
      <th>Set</th>
      <th>Packet</th>
      <th>Q#</th>
      <th>Category</th>
      <th>Link</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const question of questions) {
    for (const pg of question.pronunciationGuides) {
      tbody.appendChild(createResultRow(pg, question, type));
    }
    // If no PGs were extracted (shouldn't happen), still show the question
    if (question.pronunciationGuides.length === 0) {
      tbody.appendChild(createResultRow('', question, type));
    }
  }
  table.appendChild(tbody);
  container.appendChild(table);

  return container;
}

async function search (word) {
  resultsContainer.classList.add('d-none');
  noResults.classList.add('d-none');
  loading.classList.remove('d-none');

  try {
    const response = await fetch('/api/pg-lookup?' + new URLSearchParams({ word }));
    if (!response.ok) {
      const text = await response.text();
      window.alert(`Error: ${text}`);
      return;
    }

    const { tossups, bonuses } = await response.json();
    const totalCount = tossups.length + bonuses.length;

    loading.classList.add('d-none');

    if (totalCount === 0) {
      noResults.classList.remove('d-none');
      return;
    }

    resultsSummary.textContent = `Found ${totalCount} result${totalCount === 1 ? '' : 's'} for \u201C${word}\u201D`;

    tossupResults.innerHTML = '';
    bonusResults.innerHTML = '';
    tossupResults.appendChild(createResultsTable(tossups, 'tossup'));
    bonusResults.appendChild(createResultsTable(bonuses, 'bonus'));

    resultsContainer.classList.remove('d-none');
  } catch (err) {
    loading.classList.add('d-none');
    window.alert(`Error: ${err.message}`);
  }
}
