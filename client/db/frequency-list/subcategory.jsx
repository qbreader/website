import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.jsx';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import filterParams from '../../scripts/utilities/filter-params.js';
import { DIFFICULTIES, DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR } from '../../../quizbowl/constants.js';
import { setYear, addSliderEventListeners } from '../../play/year-slider.js';

let difficulties = DIFFICULTIES;
let limit = 50;
let minYear = DEFAULT_MIN_YEAR;
let maxYear = DEFAULT_MAX_YEAR;
let questionType = 'all';
const searchParams = new URLSearchParams(window.location.search);
const isAlternate = searchParams.get('alternate') === 'true';
const isCategory = searchParams.get('category') === 'true';
const subcategory = titleCase(searchParams.keys().next().value);

function difficultyDropdownListener () {
  difficulties = getDropdownValues('difficulties');
  if (difficulties.length === 0) { difficulties = DIFFICULTIES; }
  updateFrequencyListDisplay(difficulties, limit, minYear, maxYear, questionType);
}

function titleCase (name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateFrequencyListDisplay (difficulties, limit, minYear, maxYear, questionType) {
  const table = document.getElementById('frequency-list');
  table.innerHTML = '';

  document.getElementsByClassName('spinner-border')[0].classList.remove('d-none');

  const params = {
    difficulties,
    limit,
    minYear,
    maxYear,
    questionType,
    [isCategory ? 'category' : isAlternate ? 'alternateSubcategory' : 'subcategory']: subcategory
  };

  fetch('/api/frequency-list?' + new URLSearchParams(filterParams(params)))
    .then(response => response.json())
    .then(response => {
      const { frequencyList } = response;
      table.innerHTML = '';

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

document.getElementById('limit-select').addEventListener('change', event => {
  limit = event.target.value;
  document.getElementById('limit').textContent = limit;
  updateFrequencyListDisplay(difficulties, limit, minYear, maxYear, questionType);
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
  updateFrequencyListDisplay(difficulties, limit, minYear, maxYear, questionType);
});

addSliderEventListeners((year, which) => {
  if (which === 'min-year') {
    minYear = year;
    setYear(minYear, 'min-year');
  } else {
    maxYear = year;
    setYear(maxYear, 'max-year');
  }
  updateFrequencyListDisplay(difficulties, limit, minYear, maxYear, questionType);
});

document.getElementById('subcategory-name').textContent = subcategory;
updateFrequencyListDisplay(difficulties, limit, minYear, maxYear, questionType);

const root = ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root'));
root.render(<DifficultyDropdown onChange={difficultyDropdownListener} />);
