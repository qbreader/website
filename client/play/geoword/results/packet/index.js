import { getBuzzGraphData, getBuzzGraphHTML, getBuzzTableHTML, getCluesHTML } from './html.js';
import { countBuzzGraphBuzzes, drawBuzzGraph, getBuzzGraphTime, setBuzzGraphDot, setBuzzGraphPlayhead } from './buzz-graph.js';
import { getFilterChipsHTML, getFilterHTML, getFilterSummary, isFiltered, matchesFilter, readFilters, searchFilterMenu, writeFilters } from './filter.js';
import { formatTime, hasClueTimes } from './time.js';
import createTabs from '../../../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
const buzzpointsByQuestion = new Map();
let packets = {};
let filters = new Map();
const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const graphResizeObserver = new window.ResizeObserver(entries => {
  for (const { target } of entries) { drawBuzzGraph(target); }
});
// Only the active division's toolbar has a size; hidden ones measure 0
const toolbarResizeObserver = new window.ResizeObserver(entries => {
  for (const { target } of entries) {
    if (target.offsetHeight > 0) { document.documentElement.style.setProperty('--buzz-toolbar-height', `${target.offsetHeight}px`); }
  }
});
let currentQuestionFrame = null;

function getBuzzpoints (division, questionNumber) {
  return buzzpointsByQuestion.get(`${division}/${questionNumber}`) ?? [];
}

function getShownBuzzpoints (division, questionNumber) {
  const filter = filters.get(division);
  return getBuzzpoints(division, questionNumber).filter(buzz => !filter || matchesFilter(filter, buzz));
}

function getTossupId (division, tossup) {
  return `${kebabCase(division)}-question-${tossup.questionNumber}`;
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
  const buzzpoints = getShownBuzzpoints(division, tossup.questionNumber);

  return `
    <section class="mb-5 buzzpoints-section" id="${id}" aria-labelledby="${id}-heading">
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
        ${getBuzzpointsHTML(tossup, buzzpoints)}
      </div>
    </section>`;
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string} HTML for the tossup's buzz graph and table, if it has buzzes to show
 */
function getBuzzpointsHTML (tossup, buzzpoints) {
  if (buzzpoints.length === 0) { return ''; }
  return (tossup.duration ? getBuzzGraphHTML(tossup, buzzpoints) : '') + getBuzzTableHTML(tossup, buzzpoints);
}

/**
 * @param {HTMLElement} section
 * @param {object} tossup
 * @param {object[]} buzzpoints
 */
function drawTossupGraph (section, tossup, buzzpoints) {
  const graph = section.querySelector('.buzz-graph');
  if (!graph) { return; }
  drawBuzzGraph(graph, getBuzzGraphData(tossup, buzzpoints));
  graphResizeObserver.observe(graph);
}

/**
 * Redraws everything in a tossup that depends on which buzzes are shown, leaving its audio playing.
 * @param {string} division
 * @param {object} tossup
 */
function renderBuzzpoints (division, tossup) {
  const section = document.getElementById(getTossupId(division, tossup));
  const buzzpoints = getShownBuzzpoints(division, tossup.questionNumber);

  const graph = section.querySelector('.buzz-graph');
  if (graph) {
    graphResizeObserver.unobserve(graph);
    graph.remove();
  }
  section.querySelector('.buzz-table-slot')?.remove();

  section.querySelector('.buzzpoints-clues').outerHTML = getCluesHTML(tossup, buzzpoints);
  section.querySelector('.buzzpoints-layout').classList.toggle('has-buzzpoints', buzzpoints.length > 0);
  section.querySelector('.buzzpoints-answer').insertAdjacentHTML('afterend', getBuzzpointsHTML(tossup, buzzpoints));
  drawTossupGraph(section, tossup, buzzpoints);
  showPosition(section);
}

/**
 * @param {string} division
 */
function applyFilter (division) {
  const filter = filters.get(division);
  const bar = document.getElementById(`${kebabCase(division)}-content`).querySelector('[data-buzz-filter]');
  bar.querySelector('[data-filter-chips]').innerHTML = getFilterChipsHTML(filter);
  bar.querySelector('[data-filter-summary]').textContent = getFilterSummary(filter);
  bar.querySelector('[data-filter-clear]').hidden = !isFiltered(filter);
  for (const checkbox of bar.querySelectorAll('input[type="checkbox"]')) {
    checkbox.checked = filter.teams.has(checkbox.value);
  }

  for (const tossup of packets[division]) {
    renderBuzzpoints(division, tossup);
  }
  writeFilters(filters);
}

/**
 * @param {object[]} tossups - one division's tossups
 * @param {(tossup: object) => string} getId
 * @returns {string} HTML for a row of links that jump to each question
 */
function getNavHTML (tossups, getId) {
  let html = '<nav class="ms-auto" aria-label="Questions"><ul class="pagination pagination-sm flex-wrap mb-0">';
  for (const tossup of tossups) {
    html += `<li class="page-item"><a class="page-link" href="#${getId(tossup)}" aria-label="Jump to question ${tossup.questionNumber}">${tossup.questionNumber}</a></li>`;
  }
  return html + '</ul></nav>';
}

/**
 * Marks the question being read in the active division's question links.
 */
function showCurrentQuestion () {
  currentQuestionFrame = null;
  const pane = tabContent.querySelector('.tab-pane.active');
  const toolbar = pane?.querySelector('.buzz-toolbar');
  if (!toolbar) { return; }

  // The last question whose heading has reached the bottom of the toolbar, or the top of
  // the screen once the toolbar has scrolled away on phones
  const line = Math.max(0, toolbar.getBoundingClientRect().bottom) + 24;
  const current = [...pane.querySelectorAll('section')].findLast(section => section.getBoundingClientRect().top <= line);
  for (const link of toolbar.querySelectorAll('.page-link')) {
    const active = current !== undefined && link.hash === `#${current.id}`;
    link.parentElement.classList.toggle('active', active);
    if (active) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
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

function hasPosition (audio) {
  return !audio.paused || audio.currentTime > 0;
}

/**
 * @param {HTMLAudioElement} audio
 * @returns {number}
 */
function getCurrentClue (audio) {
  if (!hasPosition(audio)) { return -1; }
  return [...audio.closest('section').querySelectorAll('button[data-start]')].findLastIndex(button => parseFloat(button.dataset.start) <= audio.currentTime);
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
  setBuzzGraphDot(graph, row?.dataset.correct === undefined
    ? null
    : { time: parseFloat(row.dataset.buzzTime), isCorrect: row.dataset.correct === 'true' }
  );
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
  if ('end' in button.dataset) {
    audio.pause();
    showPosition(section);
  } else {
    audio.play().catch(console.error);
  }
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

tabContent.addEventListener('change', event => {
  const checkbox = event.target.closest('[data-buzz-filter] input[type="checkbox"]');
  if (!checkbox) { return; }
  const division = checkbox.closest('.tab-pane').dataset.division;
  const { teams } = filters.get(division);
  if (checkbox.checked) {
    teams.add(checkbox.value);
  } else {
    teams.delete(checkbox.value);
  }
  applyFilter(division);
});

tabContent.addEventListener('click', event => {
  const button = event.target.closest('[data-filter-clear], [data-filter-remove]');
  if (!button) { return; }
  const bar = button.closest('[data-buzz-filter]');
  const division = button.closest('.tab-pane').dataset.division;
  const { teams } = filters.get(division);
  if ('filterRemove' in button.dataset) {
    teams.delete(button.dataset.filterRemove);
  } else {
    teams.clear();
  }
  applyFilter(division);
  // The button that had focus is gone
  bar.querySelector('[data-bs-toggle="dropdown"]').focus();
});

tabContent.addEventListener('input', event => {
  if (!event.target.matches('[data-filter-search]')) { return; }
  searchFilterMenu(event.target.closest('[data-buzz-filter]'), event.target.value);
});

tabContent.addEventListener('shown.bs.dropdown', event => {
  event.target.closest('[data-buzz-filter]')?.querySelector('[data-filter-search]').focus();
});

tabContent.addEventListener('hidden.bs.dropdown', event => {
  const bar = event.target.closest('[data-buzz-filter]');
  if (!bar) { return; }
  bar.querySelector('[data-filter-search]').value = '';
  searchFilterMenu(bar, '');
});

window.addEventListener('scroll', () => {
  if (currentQuestionFrame === null) {
    currentQuestionFrame = window.requestAnimationFrame(showCurrentQuestion);
  }
}, { passive: true });

document.getElementById('tabs').addEventListener('shown.bs.tab', showCurrentQuestion);

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

document.getElementById('back-link').href = `../?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

Promise.all([
  fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName })).then(response => response.json()),
  fetch('/api/geoword/paid/results/buzzpoints?' + new URLSearchParams({ packetName })).then(response => response.json())
])
  .then(([data, { buzzpoints }]) => {
    packets = data.packets;

    for (const buzz of buzzpoints) {
      const key = `${buzz.division}/${buzz.questionNumber}`;
      buzzpointsByQuestion.set(key, [...getBuzzpoints(buzz.division, buzz.questionNumber), buzz]);
    }
    const divisions = Object.keys(packets);

    // Your team first, then alphabetical
    const viewerTeamName = buzzpoints.find(buzz => buzz.isYou)?.teamName ?? null;
    const teamsByDivision = new Map(divisions.map(division => {
      const teamNames = new Set(buzzpoints.filter(buzz => buzz.division === division && buzz.teamName !== null).map(buzz => buzz.teamName));
      return [division, [...teamNames].sort((a, b) => (b === viewerTeamName) - (a === viewerTeamName) || a.localeCompare(b))];
    }));
    filters = readFilters(search, teamsByDivision);
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
      const getId = tossup => getTossupId(division, tossup);
      const teamNames = teamsByDivision.get(division);
      let innerHTML = `
        <div class="buzz-toolbar d-flex flex-wrap align-items-center gap-2 py-2 mb-4">
          ${teamNames.length > 0 ? getFilterHTML(teamNames, filters.get(division), viewerTeamName) : ''}
          ${getNavHTML(packets[division], getId)}
        </div>`;
      for (const tossup of packets[division]) {
        innerHTML += getTossupHTML(tossup, division, getId(tossup));
      }
      divs[division].dataset.division = division;
      divs[division].innerHTML += innerHTML;

      for (const tossup of packets[division]) {
        drawTossupGraph(document.getElementById(getId(tossup)), tossup, getShownBuzzpoints(division, tossup.questionNumber));
      }
      toolbarResizeObserver.observe(divs[division].querySelector('.buzz-toolbar'));
    }
    showCurrentQuestion();

    // Drop any team in the URL that isn't in this packet
    writeFilters(filters);
  });
