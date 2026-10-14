import { buzzes, packets } from '../collections.js';

import scoreBuzz from '../../../shared/geoword-scoring.js';

async function resolveProtest (buzzId, decision, reason) {
  const updateDocument = { pendingProtest: false, decision, reason };

  if (decision === 'accept') {
    const buzz = await buzzes.findOne({ _id: buzzId });
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
