import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
/** `${division}/${questionNumber}` -> every buzz on that tossup, earliest first */
const buzzpointsByQuestion = new Map();
// How many rows of pills a clue shows before collapsing the rest
const MAX_PILL_ROWS = 2;
// The widest column, since a clue can draw buzzes from most of the field
const BUZZPOINTS_CLASS = 'buzzpoints col-md-7 d-flex flex-wrap align-content-center gap-1 px-3 py-2';

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
 * @param {string} division
 * @returns {string} HTML for the tossup's clues: buttons that jump to each clue if their
 * start times are known, a plain list if not, or the question text if there is no list
 */
function getCluesHTML (tossup, division) {
  const label = `aria-label="Clues for question ${tossup.questionNumber}"`;
  const buzzpoints = getBuzzpoints(division, tossup.questionNumber);
  // Where buzzes can't be placed on a clue, they are listed together
  const buzzpointsHTML = buzzpoints.length === 0
    ? ''
    : `<div class="d-flex flex-wrap gap-1 mb-2" aria-label="Buzzes">${getPillsHTML(buzzpoints)}</div>`;

  if (hasClueTimes(tossup)) {
    // Each clue has a column on its right for the buzzes that came during it, which takes
    // the audio's duration to work out. Packets uploaded before it was stored have none.
    const byClue = tossup.duration ? groupByClue(buzzpoints, tossup.clipBoundaries, tossup.duration) : null;
    let html = `<div class="list-group mb-2" role="group" ${label}>`;
    tossup.clues.forEach((clue, index) => {
      const start = tossup.clipBoundaries[index];
      html += `
        <div class="list-group-item p-0 d-md-flex">
          <button type="button" class="list-group-item list-group-item-action border-0 rounded-0 d-flex align-items-baseline gap-3" data-start="${start}">
            <span class="font-monospace opacity-75">${formatTime(start)}</span>
            <span>${escapeHTML(clue)}</span>
            <i class="bi bi-play-fill ms-auto invisible" aria-hidden="true"></i>
          </button>
          ${byClue ? `<div class="${BUZZPOINTS_CLASS}">${getPillsHTML(byClue[index])}</div>` : ''}
        </div>`;
    });
    const afterAudio = byClue?.[tossup.clues.length] ?? [];
    if (afterAudio.length > 0) {
      html += `
        <div class="list-group-item p-0 d-md-flex">
          <div class="flex-grow-1 px-3 py-2 d-flex align-items-baseline gap-3" title="After the audio ended">
            <span class="font-monospace opacity-75" aria-hidden="true">-:--</span>
            <span style="font-variant-caps: all-small-caps">End</span>
          </div>
          <div class="${BUZZPOINTS_CLASS}">${getPillsHTML(afterAudio)}</div>
        </div>`;
    }
    return html + '</div>' + (byClue ? '' : buzzpointsHTML);
  }

  if (Array.isArray(tossup.clues)) {
    let html = `<ol class="list-group list-group-numbered mb-2" ${label}>`;
    for (const clue of tossup.clues) {
      html += `<li class="list-group-item">${escapeHTML(clue)}</li>`;
    }
    return html + '</ol>' + buzzpointsHTML;
  }

  return `<p class="mb-2">${tossup.question}</p>` + buzzpointsHTML;
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
 * @param {object[]} buzzes - earliest first
 * @returns {string} HTML for a pill per buzz, then a button for revealing the ones that
 * collapsePills hides
 */
function getPillsHTML (buzzes) {
  if (buzzes.length === 0) { return ''; }

  return buzzes.map(getPillHTML).join('') + `
    <button type="button" class="btn btn-outline-secondary rounded-pill buzzpoints-toggle d-none" data-buzzpoints-toggle
      aria-expanded="false"></button>`;
}

/**
 * @param {object} buzz
 * @returns {string} HTML for a pill naming who buzzed, with the details in a tooltip
 */
function getPillHTML (buzz) {
  const who = buzz.isYou ? `${buzz.username} (you)` : buzz.isTeammate ? `${buzz.username} (teammate)` : buzz.username;
  // e.g. 0.485 (+10): "The Stranger"
  const details = `${(buzz.celerity ?? 0).toFixed(3)} (${buzz.points > 0 ? '+' : ''}${buzz.points}): "${buzz.givenAnswer}"`;
  // A dot marks you and your teammates
  const marker = buzz.isYou || buzz.isTeammate ? '<i class="bi bi-circle-fill me-1 buzzpoint-marker" aria-hidden="true"></i>' : '';
  // Green for points, red for a neg, gray for a wrong answer that cost nothing
  const color = buzz.points > 0 ? 'bg-success' : buzz.points < 0 ? 'bg-danger' : 'bg-secondary';

  return `
    <span class="badge rounded-pill ${color}" tabindex="0" ${buzz.isYou || buzz.isTeammate ? 'data-yours' : ''}
      data-bs-toggle="tooltip" data-bs-title="${escapeHTML(details)}" aria-label="${escapeHTML(`${who}: ${details}`)}">${marker}${escapeHTML(buzz.username)}</span>`;
}

/**
 * @param {HTMLElement[]} elements - laid out in the same wrapping row
 * @returns {number} how many rows the visible ones wrap onto
 */
function countRows (elements) {
  return new Set(elements.filter(element => !element.classList.contains('d-none')).map(element => element.offsetTop)).size;
}

/**
 * Collapses a group of pills to MAX_PILL_ROWS rows, hiding the latest buzzes first and
 * ending the last row with a "+N" button that reveals them. Yours and your teammates'
 * stay in view. How many pills fit a row depends on the width they wrap to, so this
 * measures them, and has to run again when that width changes.
 * @param {HTMLElement} group - the element holding the pills and their toggle button
 */
function collapsePills (group) {
  const toggle = group.querySelector('[data-buzzpoints-toggle]');
  // An expanded group stays expanded, and a group in a hidden tab can't be measured
  if (!toggle || toggle.getAttribute('aria-expanded') === 'true' || group.offsetParent === null) { return; }

  const pills = [...group.querySelectorAll('.badge')];
  for (const pill of pills) { pill.classList.remove('d-none'); }
  toggle.classList.add('d-none');
  if (countRows(pills) <= MAX_PILL_ROWS) { return; }

  // Hide every pill past the last row, then more until the button fits on it too
  const rowTops = [...new Set(pills.map(pill => pill.offsetTop))];
  const hideable = pills.filter(pill => !pill.hasAttribute('data-yours'));
  for (const pill of hideable) {
    pill.classList.toggle('d-none', pill.offsetTop > rowTops[MAX_PILL_ROWS - 1]);
  }
  const visible = hideable.filter(pill => !pill.classList.contains('d-none'));
  const countHidden = () => pills.filter(pill => pill.classList.contains('d-none')).length;
  toggle.classList.remove('d-none');
  toggle.textContent = `+${countHidden()}`;
  while (countRows([...pills, toggle]) > MAX_PILL_ROWS && visible.length > 0) {
    visible.pop().classList.add('d-none');
    toggle.textContent = `+${countHidden()}`;
  }

  toggle.setAttribute('aria-label', `Show ${countHidden()} more buzzes`);
  // Keyboard focus on a pill that was just hidden would otherwise be lost
  if (group.contains(document.activeElement) && document.activeElement.classList.contains('d-none')) {
    toggle.focus();
  }
}

/**
 * Re-collapses every group of pills that is in view, for when the width they wrap to changes.
 */
function collapseAllPills () {
  for (const toggle of tabContent.querySelectorAll('[data-buzzpoints-toggle]')) {
    collapsePills(toggle.parentElement);
  }
}

/**
 * Reveals or re-hides the pills collapsed behind a toggle button.
 * @param {HTMLButtonElement} toggle
 */
function toggleOverflow (toggle) {
  const expanded = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', expanded);
  if (expanded) {
    toggle.textContent = 'Show less';
    toggle.setAttribute('aria-label', 'Show fewer buzzes');
    for (const pill of toggle.parentElement.querySelectorAll('.badge')) { pill.classList.remove('d-none'); }
  } else {
    collapsePills(toggle.parentElement);
  }
}

/**
 * Sorts a tossup's buzzes by the clue that was playing when each came.
 * Celerity is `1 - currentTime / duration`, so the duration turns it back into a time.
 * @param {object[]} buzzes - earliest first
 * @param {number[]} starts - the second at which each clue starts
 * @param {number} duration - the length of the tossup's audio, in seconds
 * @returns {object[][]} one list per clue, then one for buzzes after the audio ended
 */
function groupByClue (buzzes, starts, duration) {
  const lists = [...starts, 'after the audio'].map(() => []);

  for (const buzz of buzzes) {
    const celerity = buzz.celerity ?? 0;
    const index = celerity > 0
      ? Math.max(0, starts.findLastIndex(start => start <= (1 - celerity) * duration))
      : starts.length;
    lists[index].push(buzz);
  }

  return lists;
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
      ${getCluesHTML(tossup, division)}
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
  const toggle = event.target.closest('button[data-buzzpoints-toggle]');
  if (toggle) {
    toggleOverflow(toggle);
    return;
  }

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

// How many pills fit in two rows changes with the width they wrap to, and pills in a
// hidden tab can only be measured once it is shown
let collapseRequested = false;
window.addEventListener('resize', () => {
  if (collapseRequested) { return; }
  collapseRequested = true;
  window.requestAnimationFrame(() => {
    collapseRequested = false;
    collapseAllPills();
  });
});
document.getElementById('tabs').addEventListener('shown.bs.tab', collapseAllPills);

// One delegated instance covers every pill, including ones added later
// eslint-disable-next-line no-new
new bootstrap.Tooltip(tabContent, { selector: '[data-bs-toggle="tooltip"]' });

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

    collapseAllPills();
  });
