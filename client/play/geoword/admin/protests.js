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
// The buzz being resolved or overridden in a modal
let modalContext = null;

function getTossupElementId (division, tossup) {
  return `${kebabCase(division)}-question-${tossup.questionNumber}`;
}

function getQuestionKey (division, questionNumber) {
  return `${division}/${questionNumber}`;
}

function getVerdict (isCorrect) {
  return isCorrect ? 'correct' : 'incorrect';
}

/**
 * @param {object} buzz
 * @returns {string} what an admin can do with a buzz, then its protest and override details
 */
function getReviewHTML (buzz) {
  const attributes = `data-buzz-id="${buzz._id}"`;
  let actions = buzz.pendingProtest
    ? `<a href="#" data-action="resolve" ${attributes} data-bs-toggle="modal" data-bs-target="#resolve-protest-modal">Resolve protest</a>`
    : `<a href="#" data-action="override" ${attributes} data-bs-toggle="modal" data-bs-target="#override-modal">Change verdict</a>`;
  if (buzz.override) {
    actions += `<a href="#" data-action="revert" ${attributes}>Revert</a>`;
  }

  let badges = '';
  let details = '';
  if (buzz.pendingProtest) {
    badges += '<span class="badge bg-warning text-dark">protest pending</span>';
  } else if (buzz.pendingProtest === false) {
    badges += `<span class="badge bg-secondary text-white">protest ${buzz.decision === 'accept' ? 'accepted' : 'denied'}</span>`;
    if (buzz.reason) { details += `<small class="d-block opacity-75">${escapeHTML(buzz.reason)}</small>`; }
  }

  if (buzz.override) {
    const { original, decidedByUsername, decidedAt, reason } = buzz.override;
    badges += '<span class="badge bg-info text-dark">overridden</span>';
    details += `<small class="d-block opacity-75">by ${escapeHTML(decidedByUsername)} on ${new Date(decidedAt).toLocaleDateString()}; was ${getVerdict(original.isCorrect)} (${original.points} pts)</small>`;
    if (reason) { details += `<small class="d-block opacity-75">${escapeHTML(reason)}</small>`; }
  }

  return `
    <div class="d-flex flex-wrap gap-2">${actions}</div>
    ${badges ? `<div class="d-flex flex-wrap gap-1 my-1">${badges}</div>` : ''}
    ${details}`;
}

/**
 * @param {string} division
 * @param {number} questionNumber
 * @returns {object[]} every buzz on the question if it's expanded, otherwise the protests and overrides that match the status filter, in the order they were buzzed
 */
function getShownBuzzpoints (division, questionNumber) {
  const key = getQuestionKey(division, questionNumber);
  let buzzes;
  if (expandedQuestions.has(key)) {
    buzzes = buzzesByQuestion.get(key) ?? [];
  } else {
    const { matches } = STATUSES.find(({ value }) => value === status);
    buzzes = allProtests[division].protests.filter(buzz => buzz.questionNumber === questionNumber && matches(buzz));
  }
  return [...buzzes].sort((a, b) => (b.celerity ?? 0) - (a.celerity ?? 0));
}

function getTossupHTML (division, tossup) {
  return getQuestionSectionHTML({
    tossup,
    id: getTossupElementId(division, tossup),
    audioSrc: '/api/geoword/admin/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber })
  });
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

function getToolbarHTML (division) {
  const { packet, protests } = allProtests[division];
  const hasPending = tossup => protests.some(protest => protest.questionNumber === tossup.questionNumber && protest.pendingProtest);
  return getStatusFilterHTML(division) + getQuestionNavHTML(packet, tossup => getTossupElementId(division, tossup), { isMarked: hasPending });
}

function renderToolbar (division) {
  document.getElementById(`${kebabCase(division)}-content`).querySelector('.buzz-toolbar').innerHTML = getToolbarHTML(division);
  showCurrentQuestion();
}

function renderQuestion (division, tossup) {
  const section = document.getElementById(getTossupElementId(division, tossup));
  const expanded = expandedQuestions.has(getQuestionKey(division, tossup.questionNumber));
  renderQuestionBuzzpoints(section, tossup, getShownBuzzpoints(division, tossup.questionNumber), { extraHeader: 'Review', renderExtraCell: getReviewHTML });
  section.querySelector('[data-toggle-buzzes]').textContent = expanded ? 'Show flagged buzzes only' : 'Show all buzzes';
}

async function fetchProtests () {
  const response = await fetch('/api/geoword/admin/protests?' + new URLSearchParams({ packetName }));
  allProtests = (await response.json()).protests;
}

async function fetchQuestionBuzzes (division, questionNumber) {
  const response = await fetch('/api/geoword/admin/buzzes?' + new URLSearchParams({ packetName, division, questionNumber }));
  buzzesByQuestion.set(getQuestionKey(division, questionNumber), (await response.json()).buzzes);
}

// Reloads a question's data after one of its buzzes changed, then redraws it
async function refreshQuestion (division, questionNumber) {
  await fetchProtests();
  if (expandedQuestions.has(getQuestionKey(division, questionNumber))) {
    await fetchQuestionBuzzes(division, questionNumber);
  }

  renderToolbar(division);
  renderQuestion(division, allProtests[division].packet.find(tossup => tossup.questionNumber === questionNumber));
}

// POSTs to the admin API, alerting on failure; resolves to whether the request succeeded
async function post (path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packetName, ...body })
  });

  if (!response.ok) {
    window.alert(`Error (${response.status} ${await response.text()})`);
  }
  return response.ok;
}

function applyStatus () {
  for (const [division, { packet }] of Object.entries(allProtests)) {
    for (const tossup of packet) { renderQuestion(division, tossup); }
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

tabContent.addEventListener('click', async event => {
  const toggle = event.target.closest('[data-toggle-buzzes]');
  if (toggle) {
    const section = toggle.closest('section');
    const division = section.closest('.tab-pane').dataset.division;
    const questionNumber = parseInt(section.dataset.questionNumber);
    const key = getQuestionKey(division, questionNumber);

    if (expandedQuestions.has(key)) {
      expandedQuestions.delete(key);
    } else {
      toggle.disabled = true;
      toggle.textContent = 'Loading...';
      await fetchQuestionBuzzes(division, questionNumber);
      expandedQuestions.add(key);
      toggle.disabled = false;
    }
    renderQuestion(division, allProtests[division].packet.find(tossup => tossup.questionNumber === questionNumber));
    return;
  }

  const link = event.target.closest('[data-action]');
  if (!link) { return; }

  const { action, buzzId } = link.dataset;
  const section = link.closest('section');
  const division = section.closest('.tab-pane').dataset.division;
  const questionNumber = parseInt(section.dataset.questionNumber);
  const buzz = getShownBuzzpoints(division, questionNumber).find(buzz => buzz._id === buzzId);
  const tossup = allProtests[division].packet.find(tossup => tossup.questionNumber === questionNumber);
  modalContext = { buzzId, division, questionNumber };

  if (action === 'resolve') {
    document.getElementById('resolve-protest-id').value = buzzId;
    document.getElementById('resolve-protest-given-answer').value = buzz.givenAnswer;
    document.getElementById('resolve-protest-actual-answer').innerHTML = tossup.answer;
    document.getElementById('resolve-protest-reason').value = '';
  } else if (action === 'override') {
    document.getElementById('override-given-answer').value = buzz.givenAnswer;
    document.getElementById('override-actual-answer').innerHTML = tossup.answer;
    // default to the opposite of the current verdict
    document.getElementById('override-verdict').value = getVerdict(!buzz.isCorrect);
    document.getElementById('override-reason').value = '';
  } else if (action === 'revert') {
    event.preventDefault();
    if (!window.confirm('Revert this buzz to its original verdict and points?')) { return; }
    if (await post('/api/geoword/admin/revert-override', { buzz_id: buzzId })) {
      await refreshQuestion(division, buzz.questionNumber);
    }
  }
});

document.getElementById('resolve-protest-submit').addEventListener('click', async () => {
  const { buzzId, division, questionNumber } = modalContext;
  const decision = document.getElementById('resolve-protest-decision').value;
  const reason = document.getElementById('resolve-protest-reason').value;

  if (await post('/api/geoword/admin/resolve-protest', { buzz_id: buzzId, decision, reason })) {
    bootstrap.Modal.getInstance(document.getElementById('resolve-protest-modal')).hide();
    await refreshQuestion(division, questionNumber);
  }
});

document.getElementById('override-submit').addEventListener('click', async () => {
  const { buzzId, division, questionNumber } = modalContext;
  const verdict = document.getElementById('override-verdict').value;
  const reason = document.getElementById('override-reason').value;

  if (await post('/api/geoword/admin/override-buzz', { buzz_id: buzzId, verdict, reason })) {
    bootstrap.Modal.getInstance(document.getElementById('override-modal')).hide();
    await refreshQuestion(division, questionNumber);
  }
});

setUpBuzzpointsInteractions(tabContent);

document.getElementById('packet-name').textContent = packetTitle;

fetchProtests().then(() => {
  const divisions = Object.keys(allProtests);

  // Tabs only help when there is more than one division to choose between
  if (divisions.length === 1) {
    document.getElementById('tabs').closest('nav').classList.add('d-none');
  }

  const divs = createTabs({ tabNames: divisions });

  for (const division of divisions) {
    const { packet } = allProtests[division];
    let innerHTML = `<div class="buzz-toolbar sticky-md-top d-flex flex-wrap align-items-center gap-2 py-2 mb-4">${getToolbarHTML(division)}</div>`;
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
