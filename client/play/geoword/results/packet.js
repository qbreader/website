import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');

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
 * @param {object} tossup
 * @param {string} division
 * @param {string} id - the section's id
 * @returns {string} HTML for one tossup: its heading, prompt, player, clues, and answer
 */
function getTossupHTML (tossup, division, id) {
  const category = escapeHTML(tossup.category) + (tossup.subcategory ? ` / ${escapeHTML(tossup.subcategory)}` : '');
  const audioSrc = '/api/geoword/paid/results/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber });

  return `
    <section class="mb-5" style="scroll-margin-top: 1rem" id="${id}" aria-labelledby="${id}-heading">
      <h2 class="h5" id="${id}-heading">Question ${tossup.questionNumber}</h2>
      ${tossup.instructions ? `<div class="alert alert-info small-alert mb-2"><b>Prompt:</b> ${tossup.instructions}</div>` : ''}
      <!-- With no download, speed, or cast items left, Chrome hides the overflow menu -->
      <audio controls controlslist="nodownload noplaybackrate" disableremoteplayback preload="none" class="w-100 mb-2" src="${audioSrc}"></audio>
      ${getCluesHTML(tossup)}
      <div><b>ANSWER:</b> ${tossup.answer}</div>
      <div>&lt;${category}&gt;</div>
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

document.getElementById('back-link').href = `./?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { packets } = data;
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
    }
  });
