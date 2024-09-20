let level = 'all';
let limit = 50;
let questionType = 'all';
const subcategory = titleCase(window.location.search.substring(1));

function titleCase (name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateFrequencyListDisplay (level, limit, questionType) {
  const table = document.getElementById('frequency-list');
  table.innerHTML = '';

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

  document.getElementById('limit').textContent = limit;
  document.getElementsByClassName('spinner-border')[0].classList.remove('d-none');

  fetch('/api/frequency-list?' + new URLSearchParams({ subcategory, level, limit, questionType }))
    .then(response => response.json())
    .then(response => {
      const { frequencyList } = response;

      for (const index in frequencyList) {
        const { answer_sanitized: answerSanitized, count } = frequencyList[index];
        const row = table.insertRow();
        row.insertCell().textContent = parseInt(index) + 1;
        row.insertCell().textContent = answerSanitized;
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
  updateFrequencyListDisplay(level, limit, questionType);
});

document.getElementById('question-type-select').addEventListener('change', event => {
  questionType = event.target.value;
  updateFrequencyListDisplay(level, limit, questionType);
});

document.getElementById('subcategory-name').textContent = subcategory;
updateFrequencyListDisplay(level, limit, questionType);
