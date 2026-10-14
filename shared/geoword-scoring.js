/** A packet's scheme is `packet.scoring`; packets without one use the default. */
export const DEFAULT_SCORING_SCHEME = 'celerity';

// Celerity is 0 (or less) when the buzz came after the audio ended.
export const SCORING_SCHEMES = {
  celerity: ({ celerity, isCorrect }) => isCorrect ? 10 + Math.round(10 * celerity) : 0,
  neg5: ({ celerity, isCorrect }) => isCorrect ? 10 : (celerity <= 0 ? 0 : -5)
};

/**
 * @param {string|undefined} scheme - a key of `SCORING_SCHEMES`
 * @param {{ celerity: number, isCorrect: boolean }} buzz
 * @returns {number} the points the buzz is worth
 */
export default function scoreBuzz (scheme, buzz) {
  return SCORING_SCHEMES[scheme ?? DEFAULT_SCORING_SCHEME](buzz);
}
