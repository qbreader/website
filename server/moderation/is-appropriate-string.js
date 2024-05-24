import { inappropriateNames } from './banned-usernames.js';

/**
 * Checks if a string is appropriate for a username or room name.
 * @param {string} string - The string to check.
 * @returns {boolean} true if the string is appropriate, false otherwise
 */
export default function isAppropriateString(string) {
    if (typeof string !== 'string') {
        return false;
    }

    string = string.replace(/(-|_)/g, ' ').toLowerCase();
    const tokens = string.split(' ');

    if (inappropriateNames.some(name => tokens.includes(name))) {
        return false;
    }

    return true;
}
