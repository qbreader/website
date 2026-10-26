import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
/** `${division}/${questionNumber}` -> every buzz on that tossup, earliest first */
const buzzpointsByQuestion = new Map();
const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

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
 * Celerity is `1 - currentTime / duration`, so the duration turns it back into a time.
 * @param {object} buzz
 * @param {number} duration - the length of the tossup's audio, in seconds
 * @returns {number | null} the second of the audio the buzz came at, or null if it came after the audio ended
 */
function getBuzzTime (buzz, duration) {
  const celerity = buzz.celerity ?? 0;
  return celerity > 0 ? (1 - celerity) * duration : null;
}

/**
 * @param {number[]} starts - the second at which each clue starts
 * @param {number} time
 * @returns {number} the index of the clue playing at that time
 */
function getClueAt (starts, time) {
  return Math.max(0, starts.findLastIndex(start => start <= time));
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints - every buzz on the tossup, earliest first
 * @returns {string} HTML for the tossup's clues: buttons that jump to each clue if their
 * start times are known, a plain list if not, or the question text if there is no list
 */
function getCluesHTML (tossup, buzzpoints) {
  const label = `aria-label="Clues for question ${tossup.questionNumber}"`;

  if (hasClueTimes(tossup)) {
    // Placing a buzz on a clue takes the audio's duration. Packets uploaded before it was stored have none.
    const counts = tossup.clues.map(() => 0);
    if (tossup.duration) {
      for (const buzz of buzzpoints) {
        const time = getBuzzTime(buzz, tossup.duration);
        if (time !== null) { counts[getClueAt(tossup.clipBoundaries, time)]++; }
      }
    }
    let html = `<div class="list-group buzzpoints-clues" role="group" ${label}>`;
    tossup.clues.forEach((clue, index) => {
      const start = tossup.clipBoundaries[index];
      const count = counts[index] === 0 ? '' : `${counts[index]} ${counts[index] === 1 ? 'buzz' : 'buzzes'}`;
      html += `
        <button type="button" class="list-group-item list-group-item-action d-flex align-items-baseline gap-3" data-start="${start}">
          <span class="font-monospace opacity-75">${formatTime(start)}</span>
          <span>${escapeHTML(clue)}</span>
          <span class="ms-auto small text-nowrap opacity-75">${count}</span>
          <i class="bi bi-play-fill invisible" aria-hidden="true"></i>
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
 * @returns {object[]} every buzz on the tossup, earliest first
 */
function getBuzzpoints (division, questionNumber) {
  return buzzpointsByQuestion.get(`${division}/${questionNumber}`) ?? [];
}

/**
 * @param {object} tossup
 * @param {object[]} buzzpoints - every buzz on the tossup, earliest first
 * @returns {string} HTML for a scrolling table of the buzzes. If the audio's duration is
 * known, each row knows when its buzz came and which clue was playing, so it can be jumped to.
 */
function getBuzzTableHTML (tossup, buzzpoints) {
  let rows = '';
  for (const buzz of buzzpoints) {
    let data = '';
    if (tossup.duration) {
      const time = getBuzzTime(buzz, tossup.duration);
      // A buzz after the audio ended jumps to its end
      data = `data-buzz-time="${time ?? tossup.duration}" tabindex="0"`;
      if (time !== null && hasClueTimes(tossup)) { data += ` data-clue="${getClueAt(tossup.clipBoundaries, time)}"`; }
    }
    const who = buzz.isYou ? ' (you)' : buzz.isTeammate ? ' (teammate)' : '';
    const pointsClass = buzz.points > 0 ? 'text-success' : buzz.points < 0 ? 'text-danger' : 'text-body-secondary';

    rows += `
      <tr ${data}>
        <td class="${who ? 'fw-bold' : ''}">${escapeHTML(buzz.username)}<span class="fw-normal opacity-75">${who}</span></td>
        <td class="text-end font-monospace">${(buzz.celerity ?? 0).toFixed(3)}</td>
        <td class="text-end fw-bold ${pointsClass}">${buzz.points > 0 ? '+' : ''}${buzz.points}</td>
        <td class="buzz-table-answer" title="${escapeHTML(buzz.givenAnswer)}">${escapeHTML(buzz.givenAnswer)}</td>
      </tr>`;
  }

  return `
    <div class="buzz-table-slot">
      <div class="buzz-table" tabindex="0" aria-label="Buzzes on question ${tossup.questionNumber}">
        <table class="table table-sm table-hover mb-0">
          <thead>
            <tr><th scope="col">Player</th><th scope="col" class="text-end">Celerity</th><th scope="col" class="text-end">Points</th><th scope="col">Answer</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

/**
 * @param {object} tossup
 * @param {string} division
 * @param {string} id - the section's id
 * @returns {string} HTML for one tossup: its heading, prompt, player, clues, and answer,
 * with its buzzes beside them
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
          <!-- With no download, speed, or cast items left, Chrome hides the overflow menu -->
          <audio controls controlslist="nodownload noplaybackrate" disableremoteplayback preload="none" class="w-100" src="${audioSrc}"></audio>
        </div>
        ${getCluesHTML(tossup, buzzpoints)}
        <div class="buzzpoints-answer">
          <div><b>ANSWER:</b> ${tossup.answer}</div>
          <div>&lt;${category}&gt;</div>
        </div>
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
 * Marks the clue at the audio's position, and the buzzes that came during it, or none if index is -1.
 * @param {HTMLElement} section
 * @param {number} index
 * @returns {boolean} whether the marked clue changed
 */
function highlightClue (section, index) {
  let changed = false;
  section.querySelectorAll('button[data-start]').forEach((button, i) => {
    const active = i === index;
    if (active === button.classList.contains('active')) { return; }
    changed = true;
    button.classList.toggle('active', active);
    button.querySelector('.bi-play-fill').classList.toggle('invisible', !active);
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
 * @returns {number} the index of the clue at the audio's position, or -1 if it has none
 * or hasn't been played or moved yet
 */
function getCurrentClue (audio) {
  if (audio.paused && audio.currentTime === 0) { return -1; }
  const buttons = [...audio.closest('section').querySelectorAll('button[data-start]')];
  return buttons.findLastIndex(button => parseFloat(button.dataset.start) <= audio.currentTime);
}

/**
 * Scrolls a tossup's buzz table, and not the page, so its first buzz from a clue on is at the top.
 * @param {HTMLElement} section
 * @param {number} index - the clue
 */
function scrollTableToClue (section, index) {
  const box = section.querySelector('.buzz-table');
  if (!box) { return; }
  // Buzzes after the audio ended have no clue, and come last
  const row = [...box.querySelectorAll('tr[data-buzz-time]')].find(row => Number(row.dataset.clue ?? Infinity) >= index);
  if (!row) { return; }
  const top = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - box.querySelector('thead').offsetHeight;
  box.scrollTo({ top, behavior: scrollBehavior });
}

/**
 * Marks a buzz in the table, or none if row is null.
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
}

/**
 * Pauses the tossup at the moment a buzz came, so pressing play lets you hear what the player heard.
 * @param {HTMLTableRowElement} row
 */
function seekToBuzz (row) {
  const section = row.closest('section');
  const audio = section.querySelector('audio');
  audio.pause();
  audio.currentTime = parseFloat(row.dataset.buzzTime);
  selectBuzz(section, row);
  // Before the audio has loaded, moving it fires no timeupdate
  highlightClue(section, getCurrentClue(audio));
}

tabContent.addEventListener('click', event => {
  const row = event.target.closest('tr[data-buzz-time]');
  if (row) {
    seekToBuzz(row);
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

// The marked clue follows the audio's position, and while it plays, the table follows the clue
for (const type of ['play', 'pause', 'timeupdate']) {
  tabContent.addEventListener(type, event => {
    const audio = event.target;
    const section = audio.closest('section');
    const index = getCurrentClue(audio);
    if (highlightClue(section, index) && !audio.paused && index !== -1) {
      scrollTableToClue(section, index);
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
    }
  });
