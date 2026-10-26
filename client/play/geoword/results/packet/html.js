import { formatTime, getBuzzTime, getClueAt, hasClueTimes } from './time.js';
import { escapeHTML } from '../../../../../shared/string-utils.js';

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string}
 */
export function getCluesHTML (tossup, buzzpoints) {
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
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string}
 */
export function getBuzzTableHTML (tossup, buzzpoints) {
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
export function getBuzzGraphData (tossup, buzzpoints) {
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
export function getBuzzGraphHTML (tossup, buzzpoints) {
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
