import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');

/** Every question number in the packet, in order */
let questionNumbers = [];

/**
 * @param {number} seconds
 * @returns {string} e.g. "1:05"
 */
function formatTime (seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

/**
 * @param {number} questionNumber
 * @returns {string} the URL of this page showing that question
 */
function getQuestionURL (questionNumber) {
  return '?' + new URLSearchParams({ packetName, question: questionNumber });
}

/**
 * @returns {number} the question the URL asks for, or the first question if it asks for none that exists
 */
function getQuestionFromURL () {
  const questionNumber = parseInt(new URLSearchParams(window.location.search).get('question'));
  return questionNumbers.includes(questionNumber) ? questionNumber : questionNumbers[0];
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
 * @param {object} tossup
 * @returns {string} HTML for the tossup's clues: buttons that jump to each clue if their
 * start times are known, a plain list if not, or the question text if there is no list
 */
function getCluesHTML (tossup) {
  const label = `aria-label="Clues for question ${tossup.questionNumber}"`;

  if (hasClueTimes(tossup)) {
    let html = `<div class="list-group mb-2" role="group" ${label}>`;
    tossup.clues.forEach((clue, index) => {
      const start = tossup.clipBoundaries[index];
      html += `
        <button type="button" class="list-group-item list-group-item-action d-flex align-items-baseline gap-3" data-start="${start}">
          <span class="font-monospace opacity-75">${formatTime(start)}</span>
          <span>${escapeHTML(clue)}</span>
          <i class="bi bi-play-fill ms-auto invisible" aria-hidden="true"></i>
        </button>`;
    });
    return html + '</div>';
  }

  if (Array.isArray(tossup.clues)) {
    let html = `<ol class="list-group list-group-numbered mb-2" ${label}>`;
    for (const clue of tossup.clues) {
      html += `<li class="list-group-item">${escapeHTML(clue)}</li>`;
    }
    return html + '</ol>';
  }

  return `<p class="mb-2">${tossup.question}</p>`;
}

/**
 * A link to another question, or a disabled placeholder if there is none.
 * @param {number | undefined} questionNumber
 * @param {string} role - which link this is, so focus can follow it to the next question
 * @param {string} text
 * @param {string} label
 * @returns {string}
 */
function getPageItemHTML (questionNumber, role, text, label) {
  if (questionNumber === undefined) {
    return `<li class="page-item disabled"><span class="page-link" aria-hidden="true">${text}</span></li>`;
  }
  return `<li class="page-item"><a class="page-link" href="${getQuestionURL(questionNumber)}" data-question="${questionNumber}" data-role="${role}" aria-label="${label}">${text}</a></li>`;
}

/**
 * @param {number} current - the question this pager is shown with
 * @param {number | undefined} previous
 * @param {number | undefined} next
 * @returns {string} HTML for the row of question links above a tossup
 */
function getPagerHTML (current, previous, next) {
  // The arrows sit either side of the numbers, so only the numbers wrap on a narrow screen
  let html = '<nav class="d-flex justify-content-center align-items-start gap-1 mb-4" aria-label="Questions">';
  html += `<ul class="pagination pagination-equal mb-0">${getPageItemHTML(previous, 'previous', '&lsaquo;', `Previous: question ${previous}`)}</ul>`;
  html += '<ul class="pagination pagination-equal pagination-rows-of-ten justify-content-center flex-wrap mb-0">';
  for (const questionNumber of questionNumbers) {
    if (questionNumber === current) {
      html += `<li class="page-item active"><a class="page-link" href="${getQuestionURL(questionNumber)}" data-question="${questionNumber}" data-role="number" aria-current="page">${questionNumber}</a></li>`;
    } else {
      html += getPageItemHTML(questionNumber, 'number', questionNumber, `Question ${questionNumber}`);
    }
  }
  html += '</ul>';
  html += `<ul class="pagination pagination-equal mb-0">${getPageItemHTML(next, 'next', '&rsaquo;', `Next: question ${next}`)}</ul>`;
  return html + '</nav>';
}

/**
 * @param {number | undefined} previous
 * @param {number | undefined} next
 * @returns {string} HTML for the previous and next buttons below a tossup
 */
function getBottomLinksHTML (previous, next) {
  const link = (questionNumber, role, html) => questionNumber === undefined
    ? '<span></span>'
    : `<a class="btn btn-outline-primary" href="${getQuestionURL(questionNumber)}" data-question="${questionNumber}" data-role="${role}">${html}</a>`;

  return `
    <div class="d-flex justify-content-between mt-4">
      ${link(previous, 'bottom', `&lsaquo; Question ${previous}`)}
      ${link(next, 'bottom', `Question ${next} &rsaquo;`)}
    </div>`;
}

/**
 * @param {object} tossup
 * @param {string} division
 * @param {string} id - the section's id
 * @returns {string} HTML for one tossup: its pager, heading, prompt, player, clues, and answer
 */
function getTossupHTML (tossup, division, id) {
  const index = questionNumbers.indexOf(tossup.questionNumber);
  const previous = questionNumbers[index - 1];
  const next = questionNumbers[index + 1];
  const category = escapeHTML(tossup.category) + (tossup.subcategory ? ` / ${escapeHTML(tossup.subcategory)}` : '');
  const audioSrc = '/api/geoword/paid/results/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber });

  return `
    <section class="d-none" id="${id}" data-question="${tossup.questionNumber}" aria-labelledby="${id}-heading">
      ${getPagerHTML(tossup.questionNumber, previous, next)}
      <h2 class="h5 d-flex flex-wrap justify-content-between align-items-baseline gap-2" id="${id}-heading" tabindex="-1">
        <span>Question ${tossup.questionNumber}</span>
        <span class="fs-6 fw-normal text-body-secondary">${category}</span>
      </h2>
      ${tossup.instructions ? `<div class="alert alert-info small-alert mb-2"><b>Prompt:</b> ${tossup.instructions}</div>` : ''}
      <!-- With no download, speed, or cast items left, Chrome hides the overflow menu -->
      <audio controls controlslist="nodownload noplaybackrate" disableremoteplayback preload="none" class="w-100 mb-2" src="${audioSrc}"></audio>
      ${getCluesHTML(tossup)}
      <div><b>ANSWER:</b> ${tossup.answer}</div>
      ${getBottomLinksHTML(previous, next)}
    </section>`;
}

/**
 * Shows one question, in every division, and stops whatever was playing.
 * @param {number} questionNumber
 */
function showQuestion (questionNumber) {
  for (const audio of tabContent.querySelectorAll('audio')) {
    audio.pause();
  }
  for (const section of tabContent.querySelectorAll('section')) {
    section.classList.toggle('d-none', parseInt(section.dataset.question) !== questionNumber);
  }
}

/**
 * Marks the clue that is playing, or none if index is -1.
 * @param {HTMLElement} section
 * @param {number} index
 */
function highlightClue (section, index) {
  section.querySelectorAll('button[data-start]').forEach((button, i) => {
    const active = i === index;
    if (active === button.classList.contains('active')) { return; }
    button.classList.toggle('active', active);
    button.querySelector('.bi-play-fill').classList.toggle('invisible', !active);
    if (active) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

/**
 * @param {HTMLAudioElement} audio
 * @returns {number} the index of the clue playing at the audio's current time, or -1 if it has none
 */
function getCurrentClue (audio) {
  const buttons = [...audio.closest('section').querySelectorAll('button[data-start]')];
  return buttons.findLastIndex(button => parseFloat(button.dataset.start) <= audio.currentTime);
}

tabContent.addEventListener('click', event => {
  const link = event.target.closest('a[data-question]');
  // Let modified clicks open the question in a new tab as usual
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) { return; }
  event.preventDefault();

  const questionNumber = parseInt(link.dataset.question);
  const { role } = link.dataset;
  showQuestion(questionNumber);
  window.history.pushState(null, '', getQuestionURL(questionNumber));

  // The clicked link is now hidden, so move focus to its counterpart in the question shown
  const section = link.closest('.tab-pane').querySelector(`section[data-question="${questionNumber}"]`);
  if (role === 'bottom') {
    section.scrollIntoView({ block: 'start' });
    section.querySelector('h2').focus({ preventScroll: true });
  } else {
    // A number link becomes the current page; previous or next may be disabled on the new question
    const counterpart = role === 'number' ? null : section.querySelector(`[data-role="${role}"]`);
    (counterpart ?? section.querySelector('[aria-current="page"]')).focus();
  }
});

tabContent.addEventListener('click', event => {
  const button = event.target.closest('button[data-start]');
  if (!button) { return; }

  const audio = button.closest('section').querySelector('audio');
  audio.currentTime = parseFloat(button.dataset.start);
  audio.play().catch(console.error);
});

// Media events don't bubble, so these listen in the capture phase.
tabContent.addEventListener('play', event => {
  // Only one tossup plays at a time
  for (const audio of tabContent.querySelectorAll('audio')) {
    if (audio !== event.target) { audio.pause(); }
  }
}, true);

// Only a playing tossup has a highlighted clue
for (const type of ['play', 'pause', 'timeupdate']) {
  tabContent.addEventListener(type, event => {
    const audio = event.target;
    highlightClue(audio.closest('section'), audio.paused ? -1 : getCurrentClue(audio));
  }, true);
}

window.addEventListener('popstate', () => showQuestion(getQuestionFromURL()));

document.getElementById('back-link').href = `./?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { packets } = data;
    const divisions = Object.keys(packets);
    const tossups = Object.values(packets).flat();
    questionNumbers = [...new Set(tossups.map(tossup => tossup.questionNumber))].sort((a, b) => a - b);

    // Tabs only help when there is more than one division to choose between
    if (divisions.length === 1) {
      document.getElementById('tabs').closest('nav').classList.add('d-none');
    }

    if (tossups.some(hasClueTimes)) {
      document.getElementById('clue-hint').classList.remove('d-none');
    }

    const divs = createTabs({ tabNames: divisions });

    for (const division of divisions) {
      let innerHTML = '';
      for (const tossup of packets[division]) {
        innerHTML += getTossupHTML(tossup, division, `${kebabCase(division)}-question-${tossup.questionNumber}`);
      }
      divs[division].innerHTML += innerHTML;
    }

    showQuestion(getQuestionFromURL());
  });
