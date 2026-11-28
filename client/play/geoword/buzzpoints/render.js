import { getBuzzGraphHTML, getBuzzTableHTML, getCluesHTML } from './html.js';
import { drawTossupGraph, removeTossupGraph, showPosition, showYourBuzz } from './interactions.js';
import { escapeHTML } from '../../../../shared/string-utils.js';

function getBuzzpointsHTML (tossup, buzzpoints, { extraHeader, renderExtraCell }) {
  if (buzzpoints.length === 0) { return ''; }
  return (tossup.duration ? getBuzzGraphHTML(tossup, buzzpoints) : '') + getBuzzTableHTML(tossup, buzzpoints, { extraHeader, renderExtraCell });
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
 * @param {object} [options]
 * @param {string} [options.extraHeader] - the header of an extra last column in the buzz table
 * @param {(buzz: object) => string} [options.renderExtraCell] - the HTML of a buzz's cell in that column
 */
export function renderQuestionBuzzpoints (section, tossup, buzzpoints, { extraHeader, renderExtraCell } = {}) {
  removeTossupGraph(section);
  section.querySelector('.buzz-table-slot')?.remove();

  section.querySelector('.buzzpoints-clues').outerHTML = getCluesHTML(tossup, buzzpoints);
  section.querySelector('.buzzpoints-layout').classList.toggle('has-buzzpoints', buzzpoints.length > 0);
  section.querySelector('.buzzpoints-answer').insertAdjacentHTML('afterend', getBuzzpointsHTML(tossup, buzzpoints, { extraHeader, renderExtraCell }));
  drawTossupGraph(section, tossup, buzzpoints);
  showPosition(section);
  showYourBuzz(section);
}
