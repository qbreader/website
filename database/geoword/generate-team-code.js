import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEAM_CODE_LENGTH = 8;

/**
 * @returns {String}
 */
function generateTeamCode () {
  return Array.from({ length: TEAM_CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

export default generateTeamCode;
