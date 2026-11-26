import { titleCase } from '../../../../shared/string-utils.js';

/**
 * Reads a set-wide stats response, and says so on the page if the viewer isn't allowed to see it.
 * @param {Response} response
 * @returns {Promise<object>} the response body
 */
export async function readSetStats (response) {
  if (!response.ok) {
    const note = document.getElementById('packets-note');
    note.textContent = response.status === 401 ? 'You must log in first.' : await response.text();
    note.classList.add('text-danger');
    throw new Error(`Could not load set stats (${response.status})`);
  }
  return await response.json();
}

/**
 * @param {string[]} packetNames - the packets the stats add up
 */
export function showSetPackets (packetNames) {
  document.getElementById('packets-note').textContent = `Totals across the paid packets you have finished: ${packetNames.map(titleCase).join(', ')}.`;
}
