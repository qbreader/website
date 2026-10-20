import { randomInt } from 'crypto';

// Uppercase letters and digits, minus the lookalikes I, O, 0 and 1, so a code survives being read aloud or retyped.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEAM_CODE_LENGTH = 8;

/**
 * A team's join code: 8 characters from a 32-character alphabet, about 40 bits, drawn from the
 * operating system's CSPRNG (never Math.random). Guessing is further limited by requiring the
 * team name and rate-limiting joins.
 * @returns {String}
 */
function generateTeamCode () {
  return Array.from({ length: TEAM_CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

export default generateTeamCode;
