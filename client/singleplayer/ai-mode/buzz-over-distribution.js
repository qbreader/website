/**
 * Buzzes over a given distribution of celerities.
 * Both the `correct` and `incorrect` arrays define a distribution as follows:
 *
 * - Each element should be a nonnegative number.
 * - The element at index `i` is proportional to the probability of buzzing with celerity `i / (length - 1)`.
 * - The sum of each array is proportional to the probability of buzzing correctly or incorrectly.
 *
 * `celerity` is a number between 0 and 1 representing the fraction of the question **unread** when the player buzzes.
 * @param {object} param
 * @param {number[]} param.correct
 * @param {number[]} param.incorrect
 * @returns {{correctBuzz: boolean, celerity: number}}
 */
export default function buzzOverDistribution ({ correct, incorrect }) {
  const counts = {
    correct: correct.reduce((a, b) => a + b, 0),
    incorrect: incorrect.reduce((a, b) => a + b, 0)
  };

  // first choose whether to buzz correctly or not
  const correctBuzz = Math.random() < counts.correct / (counts.correct + counts.incorrect);
  // then choose a buzzpoint
  const celerityArray = correctBuzz ? correct : incorrect;
  const count = correctBuzz ? counts.correct : counts.incorrect;

  let random = Math.random() * count;
  let celerity = 0;
  for (let i = 0; i < celerityArray.length; i++) {
    random -= celerityArray[i];
    if (random <= 0) {
      celerity = i / (celerityArray.length - 1);
      break;
    }
  }

  return { correctBuzz, celerity };
}
