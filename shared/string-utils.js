export function escapeHTML (unsafe) {
  return unsafe?.replaceAll('&', '&amp;')?.replaceAll('<', '&lt;')?.replaceAll('>', '&gt;')?.replaceAll('"', '&quot;')?.replaceAll('\'', '&#039;');
}

export function kebabCase (string) {
  return string.replace(/\s+/g, '-').toLowerCase();
}

export function removeParentheses (string) {
  return string.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim();
}

export function titleCase (name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
export function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// neutralizeFormulas prefixes `'` to values starting with = + - @ so spreadsheets don't run them as formulas (CSV injection).
export function escapeCSVField (value, { neutralizeFormulas = false } = {}) {
  if (value === undefined || value === null) { return ''; }
  let text = String(value);
  if (neutralizeFormulas && /^[=+\-@\t\r]/.test(text)) { text = `'${text}`; }
  return `"${text.replace(/"/g, '""').replace(/\r\n|\r|\n/g, '\\n')}"`;
}

/**
 * Removes specific HTML tags (<b>, <u>, <i>, <em>) from the given string.
 *
 * @param {string} string - The input string potentially containing HTML tags.
 * @returns {string} The string with specified HTML tags removed.
 */
export function removeHTML (string) {
  return string.replace(/<\/?(b|u|i|em)>/g, '');
}

export function unformatString (string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018-\u201B]/g, '\'')
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2032-\u2037]/g, '\'')
    .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
    .replace(/\u0142/g, 'l') // ł -> l
    .replace(/\u00F8/g, 'o'); // ø -> o
}
