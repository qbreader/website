import { escapeHTML } from '../../../../../shared/string-utils.js';

/**
 * The simulated match between the two teams a division's filter shows. The server plays
 * it (see /api/geoword/paid/results/match) because the buzzes this page has include the
 * viewer's own inactive ones and don't say which belong to finished members.
 * @typedef {{ teamNames: [string, string], finished: [boolean, boolean], result: { questions: Array<{ questionNumber: number, points: [number, number] }>, points: [number, number], winner: 0 | 1 | null } | null }} Match
 */

/**
 * @param {URLSearchParams} search
 * @returns {boolean} whether the URL asks for the match to be shown
 */
export function readShowMatch (search) {
  return search.has('match');
}

/**
 * @param {boolean} showMatch
 */
export function writeShowMatch (showMatch) {
  const url = new URL(window.location.href);
  if (showMatch) {
    url.searchParams.set('match', '1');
  } else {
    url.searchParams.delete('match');
  }
  window.history.replaceState(null, '', url);
}

/**
 * @param {string} packetName
 * @param {string} division
 * @param {[string, string]} teamNames
 * @returns {Promise<Match>}
 */
export async function fetchMatch (packetName, division, teamNames) {
  const response = await fetch('/api/geoword/paid/results/match?' + new URLSearchParams({ packetName, division, teamA: teamNames[0], teamB: teamNames[1] }));
  if (!response.ok) { throw new Error(await response.text()); }
  return (await response.json()).match;
}

/**
 * @param {string} id - a unique id for the switch
 * @returns {string}
 */
export function getMatchToggleHTML (id) {
  return `
    <div class="form-check form-switch mb-0" data-match>
      <input class="form-check-input" type="checkbox" role="switch" id="${id}" data-match-toggle aria-describedby="${id}-hint">
      <label class="form-check-label small" for="${id}">Simulate match</label>
      <span class="small text-body-secondary" id="${id}-hint" data-match-hint>(choose two teams)</span>
    </div>`;
}

/**
 * @param {number} points
 * @returns {string}
 */
function getPointsHTML (points) {
  const pointsClass = points > 0 ? 'text-success' : points < 0 ? 'text-danger' : 'text-body-secondary';
  return `<span class="fw-semibold ${pointsClass}">${points > 0 ? '+' : ''}${points}</span>`;
}

/**
 * @param {Match} match
 * @param {string} standingsHref - the team standings, which explain how matches are scored
 * @returns {string}
 */
export function getMatchSummaryHTML (match, standingsHref) {
  const [a, b] = match.teamNames.map(escapeHTML);
  const note = `<span class="text-body-secondary">Only members who have finished the packet count. <a href="${standingsHref}">How matches are scored</a></span>`;

  if (match.result === null) {
    const waiting = match.teamNames.filter((teamName, index) => !match.finished[index]).map(escapeHTML);
    return `
      <p class="mb-0">${new Intl.ListFormat('en').format(waiting)} ${waiting.length === 1 ? 'has' : 'have'} no member who has finished the packet, so this match hasn't been played yet.</p>
      <p class="small mb-0">${note}</p>`;
  }

  const { points, winner } = match.result;
  const outcome = winner === null ? 'The match is a tie.' : `${winner === 0 ? a : b} wins the match.`;
  return `
    <p class="mb-0">Simulated match: <b>${a}</b> ${points[0]}, <b>${b}</b> ${points[1]}. ${outcome}</p>
    <p class="small mb-0">${note}</p>`;
}

/**
 * @param {Match} match
 * @param {number} questionNumber
 * @returns {string} what each team scored on the question, or nothing if the match hasn't been played
 */
export function getMatchQuestionHTML (match, questionNumber) {
  const question = match.result?.questions.find(question => question.questionNumber === questionNumber);
  if (!question) { return ''; }
  const [a, b] = match.teamNames.map(escapeHTML);
  return `<span class="text-body-secondary">Match:</span> ${a} ${getPointsHTML(question.points[0])} · ${b} ${getPointsHTML(question.points[1])}`;
}
