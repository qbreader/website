/**
 * Return a string that represents the bonus part label for the given bonus and index.
 * For example, '[10m]' or '[10]'.
 * @param {*} bonus
 * @param {number} index
 * @param {number} defaultValue
 * @param {string} defaultDifficulty
 * @returns {string}
 */
export default function getBonusPartLabel (bonus, index, defaultValue = 10, defaultDifficulty = '') {
  const value = bonus?.values?.[index] ?? defaultValue;
  const difficulty = bonus?.difficultyModifiers?.[index] ?? defaultDifficulty;
  return `[${value}${difficulty}]`;
}
