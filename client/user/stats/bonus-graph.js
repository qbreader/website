import { attachDropdownChecklist, getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';

function showBonusGraphStats ({ cumulative = false, difficulties = '', filterLowData = true, setName = '', includeMultiplayer = true, includeSingleplayer = true, startDate = '', endDate = '' } = {}) {
  fetch('/auth/user-stats/bonus/graph?' + new URLSearchParams({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }))
    .then(response => {
      if (response.status === 401) {
        throw new Error('Unauthenticated');
      }
      return response;
    })
    .then(response => response.json())
    .then(data => {
      let { stats } = data;
      if (filterLowData) {
        stats = stats.filter(stat => stat.count >= 5);
      }

      if (cumulative) {
        questionCountChart.data = {
          labels: stats.map(stat => stat._id),
          datasets: [
            { data: accumulate(stats.map(stat => stat.count)), label: 'Total', borderColor: '#3e95cd', fill: false },
            { data: accumulate(stats.map(stat => stat['30s'])), label: '30s', borderColor: '#8e5ea2', fill: false },
            { data: accumulate(stats.map(stat => stat['20s'])), label: '20s', borderColor: '#3cba9f', fill: false },
            { data: accumulate(stats.map(stat => stat['10s'])), label: '10s', borderColor: '#e8c3b9', fill: false },
            { data: accumulate(stats.map(stat => stat['0s'])), label: '0s', borderColor: '#c45850', fill: false }
          ]
        };
      } else {
        questionCountChart.data = {
          labels: stats.map(stat => stat._id),
          datasets: [
            { data: stats.map(stat => stat.count), label: 'Total', borderColor: '#3e95cd', fill: false },
            { data: stats.map(stat => stat['30s']), label: '30s', borderColor: '#8e5ea2', fill: false },
            { data: stats.map(stat => stat['20s']), label: '20s', borderColor: '#3cba9f', fill: false },
            { data: stats.map(stat => stat['10s']), label: '10s', borderColor: '#e8c3b9', fill: false },
            { data: stats.map(stat => stat['0s']), label: '0s', borderColor: '#c45850', fill: false }
          ]
        };
      }

      ppbChart.data = {
        labels: stats.map(stat => stat._id),
        datasets: [
          { data: stats.map(stat => stat.ppb), label: 'Points per Bonus', borderColor: '#3e95cd', fill: false }
        ]
      };

      resultPerBonus.data = {
        labels: stats.map(stat => stat._id),
        datasets: [
          { data: stats.map(stat => 100 * stat['30s'] / stat.count), label: '30 %', borderColor: '#8e5ea2', fill: false },
          { data: stats.map(stat => 100 * stat['20s'] / stat.count), label: '20 %', borderColor: '#3cba9f', fill: false },
          { data: stats.map(stat => 100 * stat['10s'] / stat.count), label: '10 %', borderColor: '#e8c3b9', fill: false },
          { data: stats.map(stat => 100 * stat['0s'] / stat.count), label: '0 %', borderColor: '#c45850', fill: false }
        ]
      };

      questionCountChart.update();
      ppbChart.update();
      resultPerBonus.update();
    });
}

function accumulate (array) {
  for (let i = 1; i < array.length; i++) {
    array[i] += array[i - 1];
  }
  return array;
}

function onSubmit (event = null) {
  if (event) {
    event.preventDefault();
  }

  const setName = document.getElementById('set-name').value;
  const difficulties = getDropdownValues('difficulties');
  const includeMultiplayer = document.getElementById('include-multiplayer').checked;
  const includeSingleplayer = document.getElementById('include-singleplayer').checked;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const cumulative = document.getElementById('cumulative').checked;
  const filter = document.getElementById('filter').checked;
  showBonusGraphStats({ cumulative, difficulties, filterLowData: filter, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}

document.getElementById('cumulative').addEventListener('change', onSubmit);
document.getElementById('filter').addEventListener('change', onSubmit);
document.getElementById('form').addEventListener('submit', onSubmit);

// eslint-disable-next-line no-undef
const questionCountChart = new Chart('question-count', {
  type: 'line',
  data: { },
  options: {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'month' }
      }
    }
  }
});

// eslint-disable-next-line no-undef
const ppbChart = new Chart('ppb', {
  type: 'line',
  data: { },
  options: {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'month' }
      },
      y: {
        min: 0,
        max: 30
      }
    }
  }
});

// eslint-disable-next-line no-undef
const resultPerBonus = new Chart('result-per-bonus', {
  type: 'line',
  data: { },
  options: {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'month' }
      },
      y: {
        min: 0,
        max: 100
      }
    }
  }
});

attachDropdownChecklist();
showBonusGraphStats();
