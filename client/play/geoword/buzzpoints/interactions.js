import { countBuzzGraphBuzzes, drawBuzzGraph, getBuzzGraphTime, setBuzzGraphDot, setBuzzGraphPlayhead } from './buzz-graph.js';
import { getBuzzGraphData } from './html.js';
import { formatTime } from './time.js';

const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const graphResizeObserver = new window.ResizeObserver(entries => {
  for (const { target } of entries) { drawBuzzGraph(target); }
});

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

export function drawTossupGraph (section, tossup, buzzpoints) {
  const graph = section.querySelector('.buzz-graph');
  if (!graph) { return; }
  drawBuzzGraph(graph, getBuzzGraphData(tossup, buzzpoints));
  graphResizeObserver.observe(graph);
}

export function removeTossupGraph (section) {
  const graph = section.querySelector('.buzz-graph');
  if (!graph) { return; }
  graphResizeObserver.unobserve(graph);
  graph.remove();
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
export function showPosition (section) {
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

/**
 * Clicking a clue, a buzz or the graph seeks the audio, and playing it highlights its position.
 * @param {HTMLElement} container - holds a `section` per question
 */
export function setUpBuzzpointsInteractions (container) {
  container.addEventListener('click', event => {
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

  container.addEventListener('mousemove', event => {
    const graph = event.target.closest('.buzz-graph');
    if (graph) { setLegendTime(graph, getBuzzGraphTime(graph, event.clientX)); }
  });

  container.addEventListener('mouseleave', event => {
    if (event.target.classList?.contains('buzz-graph')) { setLegendTime(event.target, null); }
  }, true);

  container.addEventListener('keydown', event => {
    const row = event.target.closest('tr[data-buzz-time]');
    if (!row || (event.key !== 'Enter' && event.key !== ' ')) { return; }
    event.preventDefault();
    seekToBuzz(row);
  });

  // Media events don't bubble, so these listen in the capture phase.
  container.addEventListener('play', event => {
    // Only one tossup plays at a time
    for (const audio of container.querySelectorAll('audio')) {
      if (audio !== event.target) { audio.pause(); }
    }
  }, true);

  for (const type of ['play', 'pause', 'timeupdate']) {
    container.addEventListener(type, event => {
      const audio = event.target;
      const section = audio.closest('section');
      if (showPosition(section) && !audio.paused) {
        scrollTableToClue(section, getCurrentClue(audio));
      }
    }, true);
  }
}
