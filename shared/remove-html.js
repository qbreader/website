/**
 * Removes specific HTML tags (<b>, <u>, <i>, <em>) from the given string.
 *
 * @param {string} string - The input string potentially containing HTML tags.
 * @returns {string} The string with specified HTML tags removed.
 */
export default function removeHTML (string) {
  return string.replace(/<\/?(b|u|i|em)>/g, '');
}
