import { formatTime, getBuzzClue, getBuzzTime, hasClueTimes } from './time.js';
import { escapeHTML } from '../../../../../shared/string-utils.js';
import formatCelerity from '../../format-celerity.js';

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints
 * @returns {string}
 */
export function getCluesHTML (tossup, buzzpoints) {
  const label = `aria-label="Clues for question ${tossup.questionNumber}"`;

  if (hasClueTimes(tossup)) {
    const counts = [...tossup.clues, 'End'].map(() => ({ correct: 0, total: 0 }));
    if (tossup.duration) {
      for (const buzz of buzzpoints) {
        const count = counts[getBuzzClue(buzz, tossup)];
        count.total++;
        if (buzz.points > 0) { count.correct++; }
      }
    }
    let html = `<div class="list-group buzzpoints-clues" role="group" ${label}>`;
    counts.forEach(({ correct, total }, index) => {
      const isEnd = index === tossup.clues.length;
      if (isEnd && total === 0) { return; }
      const start = isEnd ? Math.floor(tossup.duration * 1000) / 1000 : tossup.clipBoundaries[index];
      const count = total === 0
        ? ''
        : `<span title="${correct} of ${total} buzzes correct" aria-label="${correct} of ${total} buzzes correct">${correct}/${total}</span>`;
      html += `
        <button type="button" class="list-group-item list-group-item-action d-flex align-items-baseline gap-3" data-start="${start}" ${isEnd ? 'data-end title="After the audio ended"' : ''}>
          <span class="font-monospace opacity-75">${isEnd ? '-:--' : formatTime(start)}</span>
          <span ${isEnd ? 'style="font-variant-caps: all-small-caps"' : ''}>${isEnd ? 'End' : escapeHTML(tossup.clues[index])}</span>
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
      data = `data-buzz-time="${time ?? tossup.duration}" data-correct="${buzz.points > 0}" tabindex="0"`;
      if (hasClueTimes(tossup)) { data += ` data-clue="${getBuzzClue(buzz, tossup)}"`; }
    }
    const who = buzz.isYou ? 'you' : buzz.isTeammate ? 'teammate' : '';
    const pointsClass = buzz.points > 0 ? 'text-success' : buzz.points < 0 ? 'text-danger' : 'text-body-secondary';

    rows += `
      <tr ${data} ${who ? `class="buzz-table-${who}"` : ''}>
        <td class="text-break">
          <span class="d-block ${buzz.isYou ? 'fw-bold' : ''}">${escapeHTML(buzz.username)}${who ? `<span class="visually-hidden"> (${who})</span>` : ''}</span>
          ${buzz.teamName ? `<small class="d-block opacity-75">${escapeHTML(buzz.teamName)}</small>` : ''}
        </td>
        <td class="text-end">${formatCelerity(buzz.celerity ?? 0)}</td>
        <td class="text-end fw-semibold ${pointsClass}">${buzz.points > 0 ? '+' : ''}${buzz.points}</td>
        <td class="text-break">${escapeHTML(buzz.givenAnswer)}</td>
      </tr>`;
  }

  return `
    <div class="buzz-table-slot">
      <div class="buzz-table" tabindex="0" aria-label="Buzzes on question ${tossup.questionNumber}">
        <table class="table table-hover mb-0 buzz-table-fixed">
          <thead>
            <tr><th scope="col">Player</th><th scope="col" class="text-end buzz-table-celerity">Celerity</th><th scope="col" class="text-end buzz-table-points">Pts</th><th scope="col">Answer</th></tr>
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
    // Buzzes after the audio ended have no time within it, so they pile up at the very end
    const time = getBuzzTime(buzz, tossup.duration) ?? tossup.duration;
    (buzz.points > 0 ? correct : wrong).push(time);
  }
  correct.sort((a, b) => a - b);
  wrong.sort((a, b) => a - b);
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
