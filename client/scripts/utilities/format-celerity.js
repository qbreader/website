/**
 * Formats a buzz's celerity to 3 decimal places.
 * A positive celerity too small to show is "<0.001", so a buzz before the audio ended never reads as 0.000.
 * @param {number} celerity
 * @returns {string}
 */
export default function formatCelerity (celerity) {
  if (celerity > 0 && celerity < 0.001) { return '<0.001'; }
  return celerity.toFixed(3);
}
