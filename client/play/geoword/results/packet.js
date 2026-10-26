import { countBuzzGraphBuzzes, drawBuzzGraph, getBuzzGraphTime, setBuzzGraphDot, setBuzzGraphPlayhead } from './buzz-graph.js';
import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
const buzzpointsByQuestion = new Map();
const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const graphResizeObserver = new window.ResizeObserver(entries => {
  for (const { target } of entries) { drawBuzzGraph(target); }
});

/**
 * @param {number} seconds
 * @returns {string} e.g. "1:05"
 */
function formatTime (seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

/**
 * Whether a tossup has a start time for every clue, so its clues can be jumped to.
 * @param {object} tossup
 * @returns {boolean}
 */
function hasClueTimes ({ clues, clipBoundaries }) {
  return Array.isArray(clues) && Array.isArray(clipBoundaries) && clues.length === clipBoundaries.length;
}

/**
 * @param {object} buzz
 * @param {number} duration
 * @returns {number | null}
 */
function getBuzzTime (buzz, duration) {
  const celerity = buzz.celerity ?? 0;
  return celerity > 0 ? (1 - celerity) * duration : null;
}

/**
 * @param {number[]} starts
 * @param {number} time
 * @returns {number}
 */
function getClueAt (starts, time) {
  return Math.max(0, starts.findLastIndex(start => start <= time));
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string}
 */
function getCluesHTML (tossup, buzzpoints) {
  const label = `aria-label="Clues for question ${tossup.questionNumber}"`;

  if (hasClueTimes(tossup)) {
    const counts = tossup.clues.map(() => ({ correct: 0, total: 0 }));
    if (tossup.duration) {
      for (const buzz of buzzpoints) {
        const time = getBuzzTime(buzz, tossup.duration);
        if (time === null) { continue; }
        const count = counts[getClueAt(tossup.clipBoundaries, time)];
        count.total++;
        if (buzz.points > 0) { count.correct++; }
      }
    }
    let html = `<div class="list-group buzzpoints-clues" role="group" ${label}>`;
    tossup.clues.forEach((clue, index) => {
      const start = tossup.clipBoundaries[index];
      const { correct, total } = counts[index];
      const count = total === 0
        ? ''
        : `<span title="${correct} of ${total} buzzes correct" aria-label="${correct} of ${total} buzzes correct">${correct}/${total}</span>`;
      html += `
        <button type="button" class="list-group-item list-group-item-action d-flex align-items-baseline gap-3" data-start="${start}">
          <span class="font-monospace opacity-75">${formatTime(start)}</span>
          <span>${escapeHTML(clue)}</span>
          <span class="ms-auto small text-nowrap opacity-75">${count}</span>
        </button>`;
    });
    return html + '</div>';
  }

  if (Array.isArray(tossup.clues)) {
    let html = `<ol class="list-group list-group-numbered buzzpoints-clues" ${label}>`;
    for (const clue of tossup.clues) {
      html += `<li class="list-group-item">${escapeHTML(clue)}</li>`;
    }
    return html + '</ol>';
  }

  return `<p class="buzzpoints-clues mb-0">${tossup.question}</p>`;
}

/**
 * @param {string} division
 * @param {number} questionNumber
 * @returns {object[]}
 */
function getBuzzpoints (division, questionNumber) {
  return buzzpointsByQuestion.get(`${division}/${questionNumber}`) ?? [];
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string}
 */
function getBuzzTableHTML (tossup, buzzpoints) {
  let rows = '';
  for (const buzz of buzzpoints) {
    let data = '';
    if (tossup.duration) {
      const time = getBuzzTime(buzz, tossup.duration);
      data = `data-buzz-time="${time ?? tossup.duration}" tabindex="0"`;
      if (time !== null) { data += ` data-correct="${buzz.points > 0}"`; }
      if (time !== null && hasClueTimes(tossup)) { data += ` data-clue="${getClueAt(tossup.clipBoundaries, time)}"`; }
    }
    const who = buzz.isYou ? 'you' : buzz.isTeammate ? 'teammate' : '';
    const pointsClass = buzz.points > 0 ? 'text-success' : buzz.points < 0 ? 'text-danger' : 'text-body-secondary';

    rows += `
      <tr ${data} ${who ? `class="buzz-table-${who}"` : ''}>
        <td class="${buzz.isYou ? 'fw-bold' : ''}">${escapeHTML(buzz.username)}${who ? `<span class="visually-hidden"> (${who})</span>` : ''}</td>
        <td><span class="opacity-75">${escapeHTML(buzz.teamName ?? '')}</span></td>
        <td class="text-end">${(buzz.celerity ?? 0).toFixed(3)}</td>
        <td class="text-end fw-semibold ${pointsClass}">${buzz.points > 0 ? '+' : ''}${buzz.points}</td>
        <td class="buzz-table-answer" title="${escapeHTML(buzz.givenAnswer)}">${escapeHTML(buzz.givenAnswer)}</td>
      </tr>`;
  }

  return `
    <div class="buzz-table-slot">
      <div class="buzz-table" tabindex="0" aria-label="Buzzes on question ${tossup.questionNumber}">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th scope="col">Player</th><th scope="col">Team</th><th scope="col" class="text-end">Celerity</th><th scope="col" class="text-end">Points</th><th scope="col">Answer</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {{ duration: number, starts: number[], correct: number[], wrong: number[] }}
 */
function getBuzzGraphData (tossup, buzzpoints) {
  const correct = [];
  const wrong = [];
  for (const buzz of buzzpoints) {
    const time = getBuzzTime(buzz, tossup.duration);
    if (time !== null) { (buzz.points > 0 ? correct : wrong).push(time); }
  }
  return { duration: tossup.duration, starts: hasClueTimes(tossup) ? tossup.clipBoundaries : [], correct, wrong };
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string}
 */
function getBuzzGraphHTML (tossup, buzzpoints) {
  const { correct, wrong } = getBuzzGraphData(tossup, buzzpoints);
  const label = `How many correct and wrong buzzes had come by each point of question ${tossup.questionNumber}: ${correct.length} correct and ${wrong.length} wrong in all`;

  return `
    <div class="buzz-graph" role="img" aria-label="${label}">
      <div class="buzz-graph-legend" aria-hidden="true">
        <span><i class="bi bi-check-lg"></i><span class="buzz-graph-key buzz-graph-key-correct"></span><span data-count="correct" style="min-width: ${String(correct.length).length}ch">${correct.length}</span></span>
        <span><i class="bi bi-x-lg"></i><span class="buzz-graph-key buzz-graph-key-wrong"></span><span data-count="wrong" style="min-width: ${String(wrong.length).length}ch">${wrong.length}</span></span>
        <span class="buzz-graph-legend-time" hidden></span>
      </div>
    </div>`;
}

/**
 * @param {HTMLElement} graph
 * @param {number | null} time
 */
function setLegendTime (graph, time) {
  const counts = countBuzzGraphBuzzes(graph, time ?? Infinity);
  const label = graph.querySelector('.buzz-graph-legend-time');
  label.hidden = time === null;
  label.textContent = time === null ? '' : formatTime(time);
  for (const count of graph.querySelectorAll('[data-count]')) {
    count.textContent = counts[count.dataset.count];
  }
}

/**
 * @param {object} tossup
 * @param {string} division
 * @param {string} id
 * @returns {string}
 */
function getTossupHTML (tossup, division, id) {
  const category = escapeHTML(tossup.category) + (tossup.subcategory ? ` / ${escapeHTML(tossup.subcategory)}` : '');
  const audioSrc = '/api/geoword/paid/results/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber });
  const buzzpoints = getBuzzpoints(division, tossup.questionNumber);

  return `
    <section class="mb-5" style="scroll-margin-top: 1rem" id="${id}" aria-labelledby="${id}-heading">
      <h2 class="h5" id="${id}-heading">Question ${tossup.questionNumber}</h2>
      <div class="buzzpoints-layout ${buzzpoints.length > 0 ? 'has-buzzpoints' : ''}">
        <div class="buzzpoints-head">
          ${tossup.instructions ? `<div class="alert alert-info small-alert mb-0"><b>Prompt:</b> ${tossup.instructions}</div>` : ''}
          <audio controls controlslist="nodownload noplaybackrate" disableremoteplayback preload="none" class="w-100" src="${audioSrc}"></audio>
        </div>
        ${getCluesHTML(tossup, buzzpoints)}
        <div class="buzzpoints-answer">
          <div><b>ANSWER:</b> ${tossup.answer}</div>
          <div>&lt;${category}&gt;</div>
        </div>
        ${buzzpoints.length > 0 && tossup.duration ? getBuzzGraphHTML(tossup, buzzpoints) : ''}
        ${buzzpoints.length > 0 ? getBuzzTableHTML(tossup, buzzpoints) : ''}
      </div>
    </section>`;
}

/**
 * @param {object[]} tossups - one division's tossups
 * @param {(tossup: object) => string} getId
 * @returns {string} HTML for a row of links that jump to each question
 */
function getNavHTML (tossups, getId) {
  let html = '<nav aria-label="Questions"><ul class="pagination flex-wrap justify-content-center mb-4">';
  for (const tossup of tossups) {
    html += `<li class="page-item"><a class="page-link" href="#${getId(tossup)}" aria-label="Jump to question ${tossup.questionNumber}">${tossup.questionNumber}</a></li>`;
  }
  return html + '</ul></nav>';
}

/**
 * @param {HTMLElement} section
 * @param {number} index
 * @returns {boolean}
 */
function highlightClue (section, index) {
  let changed = false;
  section.querySelectorAll('button[data-start]').forEach((button, i) => {
    const active = i === index;
    if (active === button.classList.contains('active')) { return; }
    changed = true;
    button.classList.toggle('active', active);
    if (active) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  if (changed) {
    for (const row of section.querySelectorAll('tr[data-clue]')) {
      row.classList.toggle('buzz-table-current', Number(row.dataset.clue) === index);
    }
  }
  return changed;
}

/**
 * @param {HTMLAudioElement} audio
 * @returns {boolean}
 */
function hasPosition (audio) {
  return !audio.paused || audio.currentTime > 0;
}

/**
 * @param {HTMLAudioElement} audio
 * @returns {number}
 */
function getCurrentClue (audio) {
  if (!hasPosition(audio)) { return -1; }
  const buttons = [...audio.closest('section').querySelectorAll('button[data-start]')];
  return buttons.findLastIndex(button => parseFloat(button.dataset.start) <= audio.currentTime);
}

/**
 * @param {HTMLElement} section
 * @returns {boolean}
 */
function showPosition (section) {
  const audio = section.querySelector('audio');
  const graph = section.querySelector('.buzz-graph');
  if (graph) { setBuzzGraphPlayhead(graph, hasPosition(audio) ? audio.currentTime : null); }
  return highlightClue(section, getCurrentClue(audio));
}

/**
 * @param {HTMLElement} section
 * @param {number} index
 */
function scrollTableToClue (section, index) {
  const box = section.querySelector('.buzz-table');
  if (!box) { return; }
  const row = [...box.querySelectorAll('tr[data-buzz-time]')].find(row => Number(row.dataset.clue ?? Infinity) >= index);
  if (!row) { return; }
  const top = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - box.querySelector('thead').offsetHeight;
  box.scrollTo({ top, behavior: scrollBehavior });
}

/**
 * @param {HTMLElement} section
 * @param {HTMLTableRowElement | null} row
 */
function selectBuzz (section, row) {
  for (const selected of section.querySelectorAll('tr.buzz-table-selected')) {
    selected.classList.remove('buzz-table-selected');
    selected.removeAttribute('aria-current');
  }
  row?.classList.add('buzz-table-selected');
  row?.setAttribute('aria-current', 'true');

  const graph = section.querySelector('.buzz-graph');
  if (!graph) { return; }
  const onGraph = row?.dataset.correct !== undefined;
  setBuzzGraphDot(graph, onGraph ? { time: parseFloat(row.dataset.buzzTime), isCorrect: row.dataset.correct === 'true' } : null);
}

/**
 * @param {HTMLTableRowElement} row
 */
function seekToBuzz (row) {
  const section = row.closest('section');
  const audio = section.querySelector('audio');
  audio.currentTime = parseFloat(row.dataset.buzzTime);
  audio.play().catch(console.error);
  selectBuzz(section, row);
  showPosition(section);
}

tabContent.addEventListener('click', event => {
  const row = event.target.closest('tr[data-buzz-time]');
  if (row) {
    seekToBuzz(row);
    return;
  }

  const graph = event.target.closest('.buzz-graph');
  if (graph) {
    const section = graph.closest('section');
    const audio = section.querySelector('audio');
    audio.currentTime = getBuzzGraphTime(graph, event.clientX);
    selectBuzz(section, null);
    showPosition(section);
    scrollTableToClue(section, getCurrentClue(audio));
    return;
  }

  const button = event.target.closest('button[data-start]');
  if (!button) { return; }

  const section = button.closest('section');
  const audio = section.querySelector('audio');
  audio.currentTime = parseFloat(button.dataset.start);
  audio.play().catch(console.error);
  selectBuzz(section, null);
  scrollTableToClue(section, [...section.querySelectorAll('button[data-start]')].indexOf(button));
});

tabContent.addEventListener('mousemove', event => {
  const graph = event.target.closest('.buzz-graph');
  if (graph) { setLegendTime(graph, getBuzzGraphTime(graph, event.clientX)); }
});

tabContent.addEventListener('mouseleave', event => {
  if (event.target.classList?.contains('buzz-graph')) { setLegendTime(event.target, null); }
}, true);

tabContent.addEventListener('keydown', event => {
  const row = event.target.closest('tr[data-buzz-time]');
  if (!row || (event.key !== 'Enter' && event.key !== ' ')) { return; }
  event.preventDefault();
  seekToBuzz(row);
});

// Media events don't bubble, so these listen in the capture phase.
tabContent.addEventListener('play', event => {
  // Only one tossup plays at a time
  for (const audio of tabContent.querySelectorAll('audio')) {
    if (audio !== event.target) { audio.pause(); }
  }
}, true);

for (const type of ['play', 'pause', 'timeupdate']) {
  tabContent.addEventListener(type, event => {
    const audio = event.target;
    const section = audio.closest('section');
    if (showPosition(section) && !audio.paused) {
      scrollTableToClue(section, getCurrentClue(audio));
    }
  }, true);
}

document.getElementById('back-link').href = `./?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

Promise.all([
  fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName })).then(response => response.json()),
  fetch('/api/geoword/paid/results/buzzpoints?' + new URLSearchParams({ packetName })).then(response => response.json())
])
  .then(([data, { buzzpoints }]) => {
    const { packets } = data;

    for (const buzz of buzzpoints) {
      const key = `${buzz.division}/${buzz.questionNumber}`;
      buzzpointsByQuestion.set(key, [...getBuzzpoints(buzz.division, buzz.questionNumber), buzz]);
    }
    const divisions = Object.keys(packets);
    const tossups = Object.values(packets).flat();

    // Tabs only help when there is more than one division to choose between
    if (divisions.length === 1) {
      document.getElementById('tabs').closest('nav').classList.add('d-none');
    }

    if (tossups.some(hasClueTimes)) {
      document.getElementById('clue-hint').classList.remove('d-none');
    }

    const divs = createTabs({ tabNames: divisions });

    for (const division of divisions) {
      const getId = tossup => `${kebabCase(division)}-question-${tossup.questionNumber}`;
      let innerHTML = getNavHTML(packets[division], getId);
      for (const tossup of packets[division]) {
        innerHTML += getTossupHTML(tossup, division, getId(tossup));
      }
      divs[division].innerHTML += innerHTML;

      for (const tossup of packets[division]) {
        const graph = document.getElementById(getId(tossup)).querySelector('.buzz-graph');
        if (!graph) { continue; }
        drawBuzzGraph(graph, getBuzzGraphData(tossup, getBuzzpoints(division, tossup.questionNumber)));
        graphResizeObserver.observe(graph);
      }
    }
  });
