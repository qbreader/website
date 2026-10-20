import isAppropriateString from '../../../../server/moderation/is-appropriate-string.js';

export const MIN_TEAM_NAME_LENGTH = 3;
export const MAX_TEAM_NAME_LENGTH = 32;

/**
 * @param {String} teamName - already trimmed
 * @returns {String} the name with each run of whitespace collapsed to one space, as names are stored
 */
export function normalizeTeamName (teamName) {
  return teamName.replace(/\s+/g, ' ');
}

/**
 * Cleans up a team name and checks that it is allowed.
 * @param {String} teamName - already trimmed
 * @returns {{ teamName: string, error?: string }} the cleaned name, and why it is not allowed, if so
 */
export default function validateTeamName (teamName) {
  teamName = normalizeTeamName(teamName);

  if (teamName.length < MIN_TEAM_NAME_LENGTH || teamName.length > MAX_TEAM_NAME_LENGTH) {
    return { teamName, error: `Team names must be ${MIN_TEAM_NAME_LENGTH}-${MAX_TEAM_NAME_LENGTH} characters.` };
  }
  if (/\p{C}/u.test(teamName) || !isAppropriateString(teamName)) {
    return { teamName, error: 'That team name is not allowed.' };
  }
  return { teamName };
}
