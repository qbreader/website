import { setUpBuzzpointsInteractions } from '../buzzpoints/interactions.js';
import { getQuestionNavHTML, observeToolbar, trackCurrentQuestion } from '../buzzpoints/question-nav.js';
import { getQuestionSectionHTML, renderQuestionBuzzpoints } from '../buzzpoints/render.js';
import createTabs from '../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const STATUSES = [
  { value: 'pending', label: 'Pending', matches: buzz => buzz.pendingProtest },
  { value: 'resolved', label: 'Resolved', matches: buzz => buzz.pendingProtest === false },
  { value: 'overridden', label: 'Overridden', matches: buzz => buzz.override },
  { value: 'all', label: 'All', matches: () => true }
];

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
let allProtests = {};
let status = STATUSES.some(({ value }) => value === search.get('status')) ? search.get('status') : 'pending';
const showCurrentQuestion = trackCurrentQuestion({ tabContent, tabs: document.getElementById('tabs') });

// Questions showing every buzz instead of the protests and overrides matching the status filter
const expandedQuestions = new Set();
const buzzesByQuestion = new Map();
let overrideBuzzId = null;

function getTossupElementId (division, tossup) {
  return `${kebabCase(division)}-question-${tossup.questionNumber}`;
}

function getQuestionKey (division, questionNumber) {
  return `${division}/${questionNumber}`;
}

/**
 * @param {object} buzz
 * @returns {string} the buzz's protest and override details, and what an admin can do with it
 */
function getProtestHTML (buzz) {
  let html = '';
  if (buzz.pendingProtest) {
    html += `
      <span class="d-block"><span class="badge bg-warning text-dark">pending</span></span>
      <a href="#" data-protest-id="${buzz._id}" data-bs-toggle="modal" data-bs-target="#resolve-protest-modal">Resolve protest</a>`;
  } else {
    if (buzz.pendingProtest === false) {
      const reason = buzz.reason ? `<small class="d-block opacity-75">${escapeHTML(buzz.reason)}</small>` : '';
      html += `${buzz.decision === 'accept' ? 'accepted' : 'denied'}${reason}`;
    }
    html += `<a class="d-block" href="#" data-override-id="${buzz._id}" data-bs-toggle="modal" data-bs-target="#override-modal">Change verdict</a>`;
  }

  if (buzz.override) {
    const { original, decidedByUsername, decidedAt, reason } = buzz.override;
    html += `
      <span class="d-block"><span class="badge bg-info text-dark">overridden</span></span>
      <small class="d-block opacity-75">by ${escapeHTML(decidedByUsername)} on ${new Date(decidedAt).toLocaleDateString()}; was ${original.isCorrect ? 'correct' : 'incorrect'} (${original.points} pts)</small>
      ${reason ? `<small class="d-block opacity-75">${escapeHTML(reason)}</small>` : ''}
      <a href="#" data-revert-id="${buzz._id}">Revert</a>`;
  }
  return html;
}

/**
 * @param {string} division
 * @param {number} questionNumber
 * @returns {object[]} every buzz on the question if it's expanded, otherwise the protests and overrides that match the status filter, in the order they were buzzed
 */
function getShownBuzzpoints (division, questionNumber) {
  const key = getQuestionKey(division, questionNumber);
  const { matches } = STATUSES.find(({ value }) => value === status);
  const buzzes = expandedQuestions.has(key)
    ? buzzesByQuestion.get(key)
    : allProtests[division].protests.filter(buzz => buzz.questionNumber === questionNumber && matches(buzz));
  return [...buzzes].sort((a, b) => (b.celerity ?? 0) - (a.celerity ?? 0));
}

function getTossupHTML (division, tossup) {
  return getQuestionSectionHTML({
    tossup,
    id: getTossupElementId(division, tossup),
    audioSrc: '/api/geoword/admin/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber })
  });
}

function renderQuestion (division, tossup) {
  const section = document.getElementById(getTossupElementId(division, tossup));
  renderQuestionBuzzpoints(section, tossup, getShownBuzzpoints(division, tossup.questionNumber), { extraHeader: 'Review', renderExtraCell: getProtestHTML });
  const expanded = expandedQuestions.has(getQuestionKey(division, tossup.questionNumber));
  section.querySelector('[data-toggle-buzzes]').textContent = expanded ? 'Show flagged buzzes only' : 'Show all buzzes';
}

function getStatusFilterHTML (division) {
  const kebabed = kebabCase(division);

  let html = '<div class="btn-group btn-group-sm" role="group" aria-label="Show buzzes that are">';
  for (const { value, label, matches } of STATUSES) {
    html += `
      <input type="radio" class="btn-check" name="${kebabed}-status" id="${kebabed}-status-${value}" value="${value}" ${value === status ? 'checked' : ''}>
      <label class="btn btn-outline-primary" for="${kebabed}-status-${value}">${label} (${allProtests[division].protests.filter(matches).length})</label>`;
  }
  return html + '</div>';
}

function applyStatus () {
  for (const [division, { packet }] of Object.entries(allProtests)) {
    for (const tossup of packet) {
      renderQuestion(division, tossup);
    }
    for (const radio of document.querySelectorAll(`input[name="${kebabCase(division)}-status"]`)) {
      radio.checked = radio.value === status;
    }
  }

  const url = new URL(window.location.href);
  url.searchParams.set('status', status);
  window.history.replaceState(null, '', url);
}

tabContent.addEventListener('change', event => {
  if (!event.target.matches('.btn-check')) { return; }
  status = event.target.value;
  applyStatus();
});

tabContent.addEventListener('click', event => {
  const link = event.target.closest('[data-protest-id]');
  if (!link) { return; }

  const { packet, protests } = allProtests[link.closest('.tab-pane').dataset.division];
  const protest = protests.find(protest => protest._id === link.dataset.protestId);
  const tossup = packet.find(tossup => tossup.questionNumber === protest.questionNumber);

  document.getElementById('resolve-protest-id').value = protest._id;
  document.getElementById('resolve-protest-given-answer').value = protest.givenAnswer;
  document.getElementById('resolve-protest-actual-answer').innerHTML = tossup.answer;
});

tabContent.addEventListener('click', async event => {
  const toggle = event.target.closest('[data-toggle-buzzes]');
  if (!toggle) { return; }

  const section = toggle.closest('section');
  const division = section.closest('.tab-pane').dataset.division;
  const questionNumber = parseInt(section.dataset.questionNumber);
  const key = getQuestionKey(division, questionNumber);

  if (expandedQuestions.has(key)) {
    expandedQuestions.delete(key);
  } else {
    toggle.disabled = true;
    toggle.textContent = 'Loading...';
    const response = await fetch('/api/geoword/admin/buzzes?' + new URLSearchParams({ packetName, division, questionNumber }));
    buzzesByQuestion.set(key, (await response.json()).buzzes);
    expandedQuestions.add(key);
    toggle.disabled = false;
  }
  renderQuestion(division, allProtests[division].packet.find(tossup => tossup.questionNumber === questionNumber));
});

tabContent.addEventListener('click', event => {
  const link = event.target.closest('[data-override-id]');
  if (!link) { return; }

  const section = link.closest('section');
  const division = section.closest('.tab-pane').dataset.division;
  const buzz = getShownBuzzpoints(division, parseInt(section.dataset.questionNumber)).find(buzz => buzz._id === link.dataset.overrideId);
  const tossup = allProtests[division].packet.find(tossup => tossup.questionNumber === buzz.questionNumber);

  overrideBuzzId = buzz._id;
  document.getElementById('override-given-answer').value = buzz.givenAnswer;
  document.getElementById('override-actual-answer').innerHTML = tossup.answer;
  // default to the opposite of the current verdict
  document.getElementById('override-verdict').value = buzz.isCorrect ? 'incorrect' : 'correct';
  document.getElementById('override-reason').value = '';
});

tabContent.addEventListener('click', event => {
  const link = event.target.closest('[data-revert-id]');
  if (!link) { return; }

  event.preventDefault();
  if (!window.confirm('Revert this buzz to its original verdict and points?')) { return; }

  fetch('/api/geoword/admin/revert-override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packetName, buzz_id: link.dataset.revertId })
  }).then(response => {
    if (response.status === 200) {
      window.location.reload();
    } else {
      window.alert('Error reverting override');
    }
  });
});

document.getElementById('override-submit').addEventListener('click', () => {
  const verdict = document.getElementById('override-verdict').value;
  const reason = document.getElementById('override-reason').value;

  fetch('/api/geoword/admin/override-buzz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packetName, buzz_id: overrideBuzzId, verdict, reason })
  }).then(response => {
    if (response.status === 200) {
      window.location.reload();
    } else {
      window.alert('Error overriding buzz');
    }
  });
});

document.getElementById('resolve-protest-submit').addEventListener('click', () => {
  const _id = document.getElementById('resolve-protest-id').value;
  const decision = document.getElementById('resolve-protest-decision').value;
  const reason = document.getElementById('resolve-protest-reason').value;

  fetch('/api/geoword/admin/resolve-protest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packetName, buzz_id: _id, decision, reason })
  }).then(response => {
    if (response.status === 200) {
      window.location.reload();
    } else {
      window.alert('Error resolving protest');
    }
  });
});

setUpBuzzpointsInteractions(tabContent);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/admin/protests?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    allProtests = data.protests;
    const divisions = Object.keys(allProtests);

    // Tabs only help when there is more than one division to choose between
    if (divisions.length === 1) {
      document.getElementById('tabs').closest('nav').classList.add('d-none');
    }

    const divs = createTabs({ tabNames: divisions });

    for (const division of divisions) {
      const { packet, protests } = allProtests[division];
      const hasPending = tossup => protests.some(protest => protest.questionNumber === tossup.questionNumber && protest.pendingProtest);
      let innerHTML = `
        <div class="buzz-toolbar sticky-md-top d-flex flex-wrap align-items-center gap-2 py-2 mb-4">
          ${getStatusFilterHTML(division)}
          ${getQuestionNavHTML(packet, tossup => getTossupElementId(division, tossup), { isMarked: hasPending })}
        </div>`;
      for (const tossup of packet) {
        innerHTML += getTossupHTML(division, tossup);
      }
      divs[division].dataset.division = division;
      divs[division].innerHTML += innerHTML;
      observeToolbar(divs[division].querySelector('.buzz-toolbar'));

      for (const tossup of packet) {
        const section = document.getElementById(getTossupElementId(division, tossup));
        section.dataset.questionNumber = tossup.questionNumber;
        section.querySelector('h2').insertAdjacentHTML('afterend', '<p><button type="button" class="btn btn-sm btn-outline-secondary" data-toggle-buzzes>Show all buzzes</button></p>');
        renderQuestion(division, tossup);
      }
    }

    showCurrentQuestion();
  });
