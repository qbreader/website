/**
 * Fetches the list of set names, sorted first in reverse order by year,
 * and then (for sets of the same year) alphabetically.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array containing the set list.
 */
export default async function getSetList () {
  const response = await fetch('/api/set-list');
  const data = await response.json();
  return data.setList;
}
