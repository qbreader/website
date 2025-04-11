import { buzzes } from '../../collections.js';

async function recordProtest (packetName, questionNumber, userId) {
  return await buzzes.updateOne(
    { 'packet.name': packetName, questionNumber, user_id: userId },
    { $set: { pendingProtest: true } }
  );
}

export default recordProtest;
