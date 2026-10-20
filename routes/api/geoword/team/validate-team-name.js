import isAppropriateString from '../../../../server/moderation/is-appropriate-string.js';

export const MIN_TEAM_NAME_LENGTH = 3;
export const MAX_TEAM_NAME_LENGTH = 64;

/**
 * @param {String} teamName
 * @returns {String}
 */
export function normalizeTeamName (teamName) {
  return teamName.replace(/\s+/g, ' ');
}

/**
 * @param {String} teamName
 * @returns {{ teamName: string, error?: string }}
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
