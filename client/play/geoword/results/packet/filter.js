import { escapeHTML } from '../../../../../shared/string-utils.js';

/**
 * Which buzzes one division shows. A buzz is shown when it matches any chosen criterion,
 * so further criteria (e.g. players) widen the selection rather than narrow it. Nothing
 * chosen shows every buzz.
 * @typedef {{ teams: Set<string> }} BuzzFilter
 */

/**
 * Divisions are separate tournaments with no teams in common, so each team in the URL
 * belongs to exactly one division's filter.
 * @param {URLSearchParams} search
 * @param {Map<string, string[]>} teamsByDivision
 * @returns {Map<string, BuzzFilter>}
 */
export function readFilters (search, teamsByDivision) {
  const chosen = search.getAll('team');
  const filters = new Map();
  for (const [division, teamNames] of teamsByDivision) {
    filters.set(division, { teams: new Set(chosen.filter(teamName => teamNames.includes(teamName))) });
  }
  return filters;
}

/**
 * @param {Map<string, BuzzFilter>} filters
 */
export function writeFilters (filters) {
  const url = new URL(window.location.href);
  url.searchParams.delete('team');
  for (const { teams } of filters.values()) {
    for (const teamName of teams) { url.searchParams.append('team', teamName); }
  }
  window.history.replaceState(null, '', url);
}

/**
 * @param {BuzzFilter} filter
 * @returns {boolean}
 */
export function isFiltered (filter) {
  return filter.teams.size > 0;
}

/**
 * @param {BuzzFilter} filter
 * @param {object} buzz
 * @returns {boolean}
 */
export function matchesFilter (filter, buzz) {
  return !isFiltered(filter) || filter.teams.has(buzz.teamName);
}

/**
 * @param {BuzzFilter} filter
 * @returns {string}
 */
export function getFilterSummary (filter) {
  const teamNames = [...filter.teams];
  if (teamNames.length === 0) { return 'Showing every buzz'; }
  if (teamNames.length > 3) { return `Showing buzzes from ${teamNames.length} teams`; }
  return `Showing buzzes from ${new Intl.ListFormat('en').format(teamNames)}`;
}

/**
 * @param {BuzzFilter} filter
 * @returns {string} one removable chip per chosen team, or a placeholder when nothing is chosen
 */
export function getFilterChipsHTML (filter) {
  if (!isFiltered(filter)) {
    return '<span class="small">every buzz</span>';
  }

  let html = '';
  for (const teamName of filter.teams) {
    html += `
      <span class="buzz-filter-chip">
        ${escapeHTML(teamName)}
        <button type="button" class="btn-close" data-filter-remove="${escapeHTML(teamName)}" aria-label="Stop showing ${escapeHTML(teamName)}"></button>
      </span>`;
  }
  return html;
}

/**
 * @param {string[]} teamNames - the division's teams, in display order
 * @param {BuzzFilter} filter
 * @param {string | null} viewerTeamName
 * @returns {string}
 */
export function getFilterHTML (teamNames, filter, viewerTeamName) {
  let items = '';
  for (const teamName of teamNames) {
    items += `
      <label class="dropdown-item d-flex align-items-center gap-2" data-filter-option>
        <input type="checkbox" class="form-check-input mt-0" value="${escapeHTML(teamName)}" ${filter.teams.has(teamName) ? 'checked' : ''}>
        <span class="text-truncate">${escapeHTML(teamName)}${teamName === viewerTeamName ? ' <span class="text-body-secondary">(your team)</span>' : ''}</span>
      </label>`;
  }

  return `
    <div class="d-flex flex-wrap align-items-center gap-2" data-buzz-filter>
      <span class="small text-body-secondary">Showing</span>
      <span class="d-flex flex-wrap align-items-center gap-1" data-filter-chips>${getFilterChipsHTML(filter)}</span>
      <div class="dropdown">
        <button type="button" class="btn btn-link buzz-filter-add" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" aria-label="Add a team" title="Add a team">
          <i class="bi bi-plus-circle" aria-hidden="true"></i>
        </button>
        <div class="dropdown-menu buzz-filter-menu pt-0">
          <div class="p-2 sticky-top bg-body">
            <input type="search" class="form-control form-control-sm" placeholder="Search teams" aria-label="Search teams" data-filter-search>
          </div>
          <div role="group" aria-label="Show buzzes from these teams">${items}</div>
          <p class="dropdown-item-text small text-body-secondary mb-0" data-filter-empty hidden>No teams match.</p>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-link px-1" data-filter-clear ${isFiltered(filter) ? '' : 'hidden'}>Clear</button>
      <span class="visually-hidden" data-filter-summary aria-live="polite">${escapeHTML(getFilterSummary(filter))}</span>
    </div>`;
}

/**
 * Hides the menu's teams that don't contain the search text.
 * @param {HTMLElement} bar - the `[data-buzz-filter]` element
 * @param {string} query
 */
export function searchFilterMenu (bar, query) {
  const needle = query.trim().toLowerCase();
  let shown = 0;
  for (const option of bar.querySelectorAll('[data-filter-option]')) {
    const matches = option.querySelector('input').value.toLowerCase().includes(needle);
    // d-flex would override the hidden attribute
    option.classList.toggle('d-none', !matches);
    if (matches) { shown++; }
  }
  bar.querySelector('[data-filter-empty]').hidden = shown > 0;
}
