/**
 * Records a protest for an incorrect buzz.
 * @param {string} packetName
 * @param {number} questionNumber
 * @returns {Promise<boolean>} whether the protest was recorded (false on a network error or if the buzz can't be protested).
 */
export default async function recordProtest (packetName, questionNumber) {
  const response = await fetch(
    '/api/geoword/paid/play/record-protest?' + new URLSearchParams({ packetName, questionNumber }),
    { method: 'PUT' }
  ).catch(() => null);

  return response?.ok === true;
}
