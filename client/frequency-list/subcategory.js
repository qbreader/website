let level = 'all';
let limit = 50;
let questionType = 'all';
const searchParams = new URLSearchParams(window.location.search);
const alternate = searchParams.get('alternate') === 'true';
const subcategory = titleCase(searchParams.keys().next().value);

const levelToDifficulties = {
  'middle-school': [1],
  'high-school': [2, 3, 4, 5],
  'national-high-school': [5],
  college: [6, 7, 8, 9],
  open: [10],
  all: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};

function titleCase (name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateFrequencyListDisplay (level, limit, questionType) {
  const table = document.getElementById('frequency-list');
  table.innerHTML = '';

  document.getElementsByClassName('spinner-border')[0].classList.remove('d-none');

  const params = new URLSearchParams({ difficulties: levelToDifficulties[level], limit, questionType });
  params.append(alternate ? 'alternateSubcategory' : 'subcategory', subcategory);

  fetch('/api/frequency-list?' + params)
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
  updateFrequencyListDisplay(level, limit, questionType);
});

document.getElementById('limit-select').addEventListener('change', event => {
  limit = event.target.value;
  document.getElementById('limit').textContent = limit;
  updateFrequencyListDisplay(level, limit, questionType);
});

document.getElementById('question-type-select').addEventListener('change', event => {
  questionType = event.target.value;
  switch (questionType) {
    case 'tossup':
      document.getElementById('question-type').textContent = 'tossups';
      break;
    case 'bonus':
      document.getElementById('question-type').textContent = 'bonuses';
      break;
    case 'all':
      document.getElementById('question-type').textContent = 'questions';
      break;
  }
  updateFrequencyListDisplay(level, limit, questionType);
});

document.getElementById('subcategory-name').textContent = subcategory;
updateFrequencyListDisplay(level, limit, questionType);
