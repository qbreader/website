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

// Quotes a value as one CSV field; neutralizeFormulas prefixes `'` to values a spreadsheet would run as formulas.
export function escapeCSVField (value, { neutralizeFormulas = false } = {}) {
  if (value === undefined || value === null) { return ''; }
  let text = String(value);
  if (neutralizeFormulas && /^[=+\-@\t\r]/.test(text)) { text = `'${text}`; }
  return `"${text.replace(/"/g, '""').replace(/\r\n|\r|\n/g, '\\n')}"`;
}
