import * as validateInt from '../../../../validators/int.js';

import getUserId from '../../../../../database/account-info/get-user-id.js';
import getBuzzCount from '../../../../../database/geoword/get-buzz-count.js';

/**
 * Only lets a request through for the question the player is on: the one after their last recorded buzz.
 * Otherwise a paid player could fetch any question's audio, instructions, or answer ahead of time.
 * Expects packetName and questionNumber query parameters.
 */
export default async function requireCurrentQuestion (req, res, next) {
  req.query = validateInt.default(req.query, 'questionNumber', { lowerBound: 1 });
  const { packetName, questionNumber } = req.query;

  if (isNaN(questionNumber)) {
    return res.status(400).send('Invalid question number');
  }

  const userId = await getUserId(req.session.username);
  const buzzCount = await getBuzzCount(packetName, userId);
  if (questionNumber !== buzzCount + 1) {
    return res.status(403).send('You can only access the question you are on.');
  }

  next();
}
