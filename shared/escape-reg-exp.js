/**
 * Escapes characters with special meaning in regular expressions.
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 *
 * @param {string} string
 * @returns {string} The string, safe to embed in a `RegExp`.
 */
export default function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
