import { setUpBuzzpointsInteractions } from '../../buzzpoints/interactions.js';
import { getQuestionNavHTML, observeToolbar, trackCurrentQuestion } from '../../buzzpoints/question-nav.js';
import { getQuestionSectionHTML, renderQuestionBuzzpoints } from '../../buzzpoints/render.js';
import { getFilterChipsHTML, getFilterHTML, getFilterSummary, isFiltered, matchesFilter, readFiltersFromURL, searchFilterMenu, writeFiltersToURL } from './filter.js';
import { hasClueTimes } from '../../buzzpoints/time.js';
import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { kebabCase, titleCase } from '../../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

const tabContent = document.getElementById('tab-content');
const buzzpointsByQuestion = new Map();
let packets = {};
let filters = new Map();
const showCurrentQuestion = trackCurrentQuestion({ tabContent, tabs: document.getElementById('tabs') });

function getBuzzpoints (division, questionNumber) {
  return buzzpointsByQuestion.get(`${division}/${questionNumber}`) ?? [];
}

function getShownBuzzpoints (division, questionNumber) {
  const filter = filters.get(division);
  return getBuzzpoints(division, questionNumber).filter(buzz => !filter || matchesFilter(filter, buzz));
}

function getTossupElementId (division, tossup) {
  return `${kebabCase(division)}-question-${tossup.questionNumber}`;
}

/**
 * @param {object} tossup
 * @param {string} division
 * @param {string} id
 * @returns {string}
 */
function getTossupHTML (tossup, division, id) {
  return getQuestionSectionHTML({
    tossup,
    id,
    audioSrc: '/api/geoword/paid/results/audio/question.mp3?' + new URLSearchParams({ packetName, division, questionNumber: tossup.questionNumber })
  });
}

function renderBuzzpoints (division, tossup) {
  const section = document.getElementById(getTossupElementId(division, tossup));
  renderQuestionBuzzpoints(section, tossup, getShownBuzzpoints(division, tossup.questionNumber));
}

function applyFilter (division) {
  const filter = filters.get(division);
  const bar = document.getElementById(`${kebabCase(division)}-content`).querySelector('[data-buzz-filter]');
  bar.querySelector('[data-filter-chips]').innerHTML = getFilterChipsHTML(filter);
  bar.querySelector('[data-filter-summary]').textContent = getFilterSummary(filter);
  bar.querySelector('[data-filter-clear]').hidden = !isFiltered(filter);
  for (const checkbox of bar.querySelectorAll('input[type="checkbox"]')) {
    checkbox.checked = filter.teams.has(checkbox.value);
  }

  for (const tossup of packets[division]) {
    renderBuzzpoints(division, tossup);
  }
  writeFiltersToURL(filters);
}

tabContent.addEventListener('change', event => {
  const checkbox = event.target.closest('[data-buzz-filter] input[type="checkbox"]');
  if (!checkbox) { return; }
  const division = checkbox.closest('.tab-pane').dataset.division;
  const { teams } = filters.get(division);
  if (checkbox.checked) {
    teams.add(checkbox.value);
  } else {
    teams.delete(checkbox.value);
  }
  applyFilter(division);
});

tabContent.addEventListener('click', event => {
  const button = event.target.closest('[data-filter-clear], [data-filter-remove]');
  if (!button) { return; }
  const bar = button.closest('[data-buzz-filter]');
  const division = button.closest('.tab-pane').dataset.division;
  const { teams } = filters.get(division);
  if ('filterRemove' in button.dataset) {
    teams.delete(button.dataset.filterRemove);
  } else {
    teams.clear();
  }
  applyFilter(division);
  bar.querySelector('[data-bs-toggle="dropdown"]').focus();
});

tabContent.addEventListener('input', event => {
  if (!event.target.matches('[data-filter-search]')) { return; }
  searchFilterMenu(event.target.closest('[data-buzz-filter]'), event.target.value);
});

tabContent.addEventListener('shown.bs.dropdown', event => {
  event.target.closest('[data-buzz-filter]')?.querySelector('[data-filter-search]').focus();
});

tabContent.addEventListener('hidden.bs.dropdown', event => {
  const bar = event.target.closest('[data-buzz-filter]');
  if (!bar) { return; }
  bar.querySelector('[data-filter-search]').value = '';
  searchFilterMenu(bar, '');
});

setUpBuzzpointsInteractions(tabContent);

document.getElementById('back-link').href = `../?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

Promise.all([
  fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName })).then(response => response.json()),
  fetch('/api/geoword/paid/results/buzzpoints?' + new URLSearchParams({ packetName })).then(response => response.json())
])
  .then(([data, { buzzpoints }]) => {
    packets = data.packets;

    for (const buzz of buzzpoints) {
      const key = `${buzz.division}/${buzz.questionNumber}`;
      buzzpointsByQuestion.set(key, [...getBuzzpoints(buzz.division, buzz.questionNumber), buzz]);
    }
    const divisions = Object.keys(packets);

    const viewerTeamName = buzzpoints.find(buzz => buzz.isYou)?.teamName ?? null;
    const teamsByDivision = new Map(divisions.map(division => {
      const teamNames = new Set(buzzpoints.filter(buzz => buzz.division === division && buzz.teamName !== null).map(buzz => buzz.teamName));
      return [division, [...teamNames].sort((a, b) => (b === viewerTeamName) - (a === viewerTeamName) || a.localeCompare(b))];
    }));
    filters = readFiltersFromURL(search, teamsByDivision);
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
      const getId = tossup => getTossupElementId(division, tossup);
      const teamNames = teamsByDivision.get(division);
      let innerHTML = `
        <div class="buzz-toolbar sticky-md-top d-flex flex-wrap align-items-center gap-2 py-2 mb-4">
          ${teamNames.length > 0 ? getFilterHTML(teamNames, filters.get(division), viewerTeamName) : ''}
          ${getQuestionNavHTML(packets[division], getId)}
        </div>`;
      for (const tossup of packets[division]) {
        innerHTML += getTossupHTML(tossup, division, getId(tossup));
      }
      divs[division].dataset.division = division;
      divs[division].innerHTML += innerHTML;

      for (const tossup of packets[division]) {
        renderBuzzpoints(division, tossup);
      }
      observeToolbar(divs[division].querySelector('.buzz-toolbar'));
    }
    showCurrentQuestion();

    writeFiltersToURL(filters);
  });
