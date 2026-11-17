import { drawTossupGraph, setUpBuzzpointsInteractions } from '../buzzpoints/interactions.js';
import { getQuestionNavHTML, observeToolbar, trackCurrentQuestion } from '../buzzpoints/question-nav.js';
import { getQuestionSectionHTML, renderQuestionBuzzpoints } from '../buzzpoints/render.js';
import createTabs from '../../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../../../shared/string-utils.js';

const STATUSES = [
  { value: 'pending', label: 'Pending', matches: buzz => buzz.pendingProtest },
  { value: 'resolved', label: 'Resolved', matches: buzz => buzz.pendingProtest === false },
  { value: 'all', label: 'All', matches: () => true }
];

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
let allProtests = {};
let status = STATUSES.some(({ value }) => value === search.get('status')) ? search.get('status') : 'pending';
const showCurrentQuestion = trackCurrentQuestion({ tabContent, tabs: document.getElementById('tabs') });
const tableOptions = { extraColumn: { header: 'Protest', render: getProtestHTML } };

function getTossupElementId (division, tossup) {
  return `${kebabCase(division)}-question-${tossup.questionNumber}`;
}

/**
 * @param {object} buzz - a buzz that was protested
 * @returns {string}
 */
function getProtestHTML (buzz) {
  if (buzz.pendingProtest) {
    return `
      <span class="d-block"><span class="badge bg-warning text-dark">pending</span></span>
      <a href="#" data-protest-id="${buzz._id}" data-bs-toggle="modal" data-bs-target="#resolve-protest-modal">Resolve protest</a>`;
  }

  const reason = buzz.reason ? `<small class="d-block opacity-75">${escapeHTML(buzz.reason)}</small>` : '';
  return `${buzz.decision === 'accept' ? 'accepted' : 'denied'}${reason}`;
}

/**
 * @param {string} division
 * @param {number} questionNumber
 * @returns {object[]} the protests on a question that match the status filter, in the order they were buzzed
 */
function getShownBuzzpoints (division, questionNumber) {
  const { matches } = STATUSES.find(({ value }) => value === status);
  return allProtests[division].protests
    .filter(buzz => buzz.questionNumber === questionNumber && matches(buzz))
    .sort((a, b) => (b.celerity ?? 0) - (a.celerity ?? 0));
}

function getTossupHTML (division, tossup) {
  return getQuestionSectionHTML({
    tossup,
    id: getTossupElementId(division, tossup),
    audioSrc: '/api/geoword/admin/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber }),
    buzzpoints: getShownBuzzpoints(division, tossup.questionNumber),
    tableOptions,
    headingClass: 'h3'
  });
}

function getStatusFilterHTML (division) {
  const kebabed = kebabCase(division);

  let html = '<div class="btn-group btn-group-sm" role="group" aria-label="Show protests that are">';
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
      renderQuestionBuzzpoints(document.getElementById(getTossupElementId(division, tossup)), tossup, getShownBuzzpoints(division, tossup.questionNumber), tableOptions);
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
          ${getQuestionNavHTML(packet, tossup => getTossupElementId(division, tossup), { isMarked: hasPending, markedLabel: 'has pending protests' })}
        </div>`;
      for (const tossup of packet) {
        innerHTML += getTossupHTML(division, tossup);
      }
      divs[division].dataset.division = division;
      divs[division].innerHTML += innerHTML;
      observeToolbar(divs[division].querySelector('.buzz-toolbar'));

      for (const tossup of packet) {
        drawTossupGraph(document.getElementById(getTossupElementId(division, tossup)), tossup, getShownBuzzpoints(division, tossup.questionNumber));
      }
    }

    showCurrentQuestion();
  });
