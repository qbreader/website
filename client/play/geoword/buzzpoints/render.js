import { getBuzzGraphHTML, getBuzzTableHTML, getCluesHTML } from './html.js';
import { drawTossupGraph, removeTossupGraph, showPosition } from './interactions.js';
import { escapeHTML } from '../../../../shared/string-utils.js';

function getBuzzpointsHTML (tossup, buzzpoints) {
  if (buzzpoints.length === 0) { return ''; }
  return (tossup.duration ? getBuzzGraphHTML(tossup, buzzpoints) : '') + getBuzzTableHTML(tossup, buzzpoints);
}

/**
 * @param {object} params
 * @param {object} params.tossup
 * @param {string} params.id
 * @param {string} params.audioSrc
 * @returns {string} a question's section without its buzzes; call `renderQuestionBuzzpoints` to fill in its clues, graph and buzz table
 */
export function getQuestionSectionHTML ({ tossup, id, audioSrc }) {
  const category = escapeHTML(tossup.category) + (tossup.subcategory ? ` / ${escapeHTML(tossup.subcategory)}` : '');

  return `
    <section class="mb-5 buzzpoints-section" id="${id}" aria-labelledby="${id}-heading">
      <h2 class="h5" id="${id}-heading">Question ${tossup.questionNumber}</h2>
      <div class="buzzpoints-layout">
        <div class="buzzpoints-head">
          ${tossup.instructions ? `<div class="alert alert-info small-alert mb-0"><b>Prompt:</b> ${tossup.instructions}</div>` : ''}
          <audio controls controlslist="nodownload noplaybackrate" disableremoteplayback preload="none" class="w-100" src="${audioSrc}"></audio>
        </div>
        <div class="buzzpoints-clues"></div>
        <div class="buzzpoints-answer">
          <div><b>ANSWER:</b> ${tossup.answer}</div>
          <div>&lt;${category}&gt;</div>
        </div>
      </div>
    </section>`;
}

/**
 * Draws a question's clues, graph and buzz table, replacing any already there and leaving its audio alone so it keeps playing.
 * @param {HTMLElement} section
 * @param {object} tossup
 * @param {object[]} buzzpoints
 */
export function renderQuestionBuzzpoints (section, tossup, buzzpoints) {
  removeTossupGraph(section);
  section.querySelector('.buzz-table-slot')?.remove();

  section.querySelector('.buzzpoints-clues').outerHTML = getCluesHTML(tossup, buzzpoints);
  section.querySelector('.buzzpoints-layout').classList.toggle('has-buzzpoints', buzzpoints.length > 0);
  section.querySelector('.buzzpoints-answer').insertAdjacentHTML('afterend', getBuzzpointsHTML(tossup, buzzpoints));
  drawTossupGraph(section, tossup, buzzpoints);
  showPosition(section);
}
