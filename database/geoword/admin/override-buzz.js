import { buzzes, packets } from '../collections.js';

import scoreBuzz from '../../../shared/geoword-scoring.js';

/**
 * Overrules whether a buzz was correct, rescoring it.
 * `isCorrect` and `points` are overwritten in place, so everything that reads them sees the new verdict.
 * The details of the override, including the buzz's original verdict, are kept in `buzz.override`.
 * Overriding a buzz again keeps its first `override.original`, so reverting always restores the true original.
 * @param {object} params
 * @param {ObjectId} params.buzzId
 * @param {String} params.packetName - the buzz must belong to this packet
 * @param {Boolean} params.isCorrect - the new verdict
 * @param {String} params.reason
 * @param {ObjectId} params.adminId - the admin overriding the buzz
 * @returns {Promise<import('mongodb').UpdateResult | null>} `null` if the buzz doesn't exist; `matchedCount` is 0 if the buzz already has this verdict.
 */
async function overrideBuzz ({ buzzId, packetName, isCorrect, reason, adminId }) {
  const buzz = await buzzes.findOne({ _id: buzzId, 'packet.name': packetName });
  if (!buzz) { return null; }

  const packet = await packets.findOne({ _id: buzz.packet._id });
  const points = scoreBuzz(packet.scoring, { celerity: buzz.celerity, isCorrect });

  // $literal so that a reason beginning with "$" isn't read as a field path
  return await buzzes.updateOne(
    { _id: buzzId, isCorrect: { $ne: isCorrect } },
    [{
      $set: {
        override: {
          original: { $ifNull: ['$override.original', { isCorrect: '$isCorrect', points: '$points' }] },
          decidedBy: adminId,
          decidedAt: new Date(),
          reason: { $literal: reason }
        },
        isCorrect,
        points
      }
    }]
  );
}

export default overrideBuzz;
