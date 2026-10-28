/**
 * Quotes a value as a single CSV field. Quotes are doubled and line breaks are
 * written as a literal `\n` so that every record stays on one line.
 *
 * @param {*} value - `null` and `undefined` become an empty field; other non-strings are stringified.
 * @param {object} [options]
 * @param {boolean} [options.neutralizeFormulas=false] - Prefix values that start with a
 * spreadsheet formula character (`= + - @`, tab, carriage return) with `'` so they are not evaluated.
 * @returns {string} The quoted field.
 */
export default function escapeCSVField (value, { neutralizeFormulas = false } = {}) {
  if (value === undefined || value === null) { return ''; }
  let text = String(value);
  if (neutralizeFormulas && /^[=+\-@\t\r]/.test(text)) { text = `'${text}`; }
  return `"${text.replace(/"/g, '""').replace(/\r\n|\r|\n/g, '\\n')}"`;
}
