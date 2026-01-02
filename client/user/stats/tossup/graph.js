import { attachDropdownChecklist, getDropdownValues } from '../../../scripts/utilities/dropdown-checklist.js';

function showTossupGraphStats ({ cumulative = false, difficulties = '', filterLowData = true, setName = '', includeMultiplayer = true, includeSingleplayer = true, startDate = '', endDate = '' } = {}) {
  fetch('/auth/user-stats/tossup/graph?' + new URLSearchParams({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }))
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
            { data: accumulate(stats.map(stat => stat.powers)), label: 'Powers', borderColor: '#8e5ea2', fill: false },
            { data: accumulate(stats.map(stat => stat.tens)), label: 'Tens', borderColor: '#3cba9f', fill: false },
            { data: accumulate(stats.map(stat => stat.deads)), label: 'Dead', borderColor: '#e8c3b9', fill: false },
            { data: accumulate(stats.map(stat => stat.negs)), label: 'Negs', borderColor: '#c45850', fill: false }
          ]
        };
      } else {
        questionCountChart.data = {
          labels: stats.map(stat => stat._id),
          datasets: [
            { data: stats.map(stat => stat.count), label: 'Total', borderColor: '#3e95cd', fill: false },
            { data: stats.map(stat => stat.powers), label: 'Powers', borderColor: '#8e5ea2', fill: false },
            { data: stats.map(stat => stat.tens), label: 'Tens', borderColor: '#3cba9f', fill: false },
            { data: stats.map(stat => stat.deads), label: 'Dead', borderColor: '#e8c3b9', fill: false },
            { data: stats.map(stat => stat.negs), label: 'Negs', borderColor: '#c45850', fill: false }
          ]
        };
      }

      pptuChart.data = {
        labels: stats.map(stat => stat._id),
        datasets: [
          { data: stats.map(stat => stat.pptu), label: 'Points per TU', borderColor: '#3e95cd', fill: false }
        ]
      };

      resultPerTossup.data = {
        labels: stats.map(stat => stat._id),
        datasets: [
          { data: stats.map(stat => 100 * stat.powers / stat.count), label: 'Power Percentage', borderColor: '#3e95cd', fill: false },
          { data: stats.map(stat => 100 * (stat.deads + stat.negs) / stat.count), label: 'Neg or Dead Percentage', borderColor: '#8e5ea2', fill: false }
        ]
      };

      celerity.data = {
        labels: stats.map(stat => stat._id),
        datasets: [
          { data: stats.map(stat => stat.averageCorrectCelerity), label: 'Average Correct Celerity', borderColor: '#3e95cd', fill: false },
          { data: stats.map(stat => stat.averageCelerity), label: 'Average Buzzpoint', borderColor: '#8e5ea2', fill: false }
        ]
      };

      questionCountChart.update();
      pptuChart.update();
      resultPerTossup.update();
      celerity.update();
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
  showTossupGraphStats({ cumulative, difficulties, filterLowData: filter, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
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
const pptuChart = new Chart('pptu', {
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
        max: 15
      }
    }
  }
});

// eslint-disable-next-line no-undef
const resultPerTossup = new Chart('result-per-tossup', {
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

// eslint-disable-next-line no-undef
const celerity = new Chart('celerity', {
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
        max: 1
      }
    }
  }
});

attachDropdownChecklist();
showTossupGraphStats();
