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
