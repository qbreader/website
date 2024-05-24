/**
 * Checks if a string contains only valid characters.
 * Valid characters are A-Z, a-z, 0-9, - and _.
 * @param {string} string
 * @returns {boolean} true if the string contains only valid characters, false otherwise
 */
export default function hasValidCharacters(string) {
    if (typeof string !== 'string') {
        return false;
    }

    const regex = /^[a-zA-Z0-9\-_]+$/;
    return regex.test(string);
}
