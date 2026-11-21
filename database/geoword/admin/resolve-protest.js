import { buzzes, packets } from '../collections.js';

import scoreBuzz from '../../../shared/geoword-scoring.js';

/**
 * Resolves a pending protest. Accepting a protest marks the buzz correct and rescores it.
 * @param {object} params
 * @param {ObjectId} params.buzzId
 * @param {String} params.packetName - the buzz must belong to this packet
 * @param {'accept' | 'deny'} params.decision
 * @param {String} params.reason
 * @returns {Promise<import('mongodb').UpdateResult | null>} `null` if the buzz doesn't exist or has no pending protest.
 */
async function resolveProtest ({ buzzId, packetName, decision, reason }) {
  const buzz = await buzzes.findOne({ _id: buzzId, 'packet.name': packetName, pendingProtest: true });
  if (!buzz) { return null; }

  const updateDocument = { pendingProtest: false, decision, reason };

  if (decision === 'accept') {
    const packet = await packets.findOne({ _id: buzz.packet._id });
    updateDocument.isCorrect = true;
    updateDocument.points = scoreBuzz(packet.scoring, { celerity: buzz.celerity, isCorrect: true });
  }

  return await buzzes.updateOne(
    { _id: buzzId },
    { $set: updateDocument }
  );
}

export default resolveProtest;
