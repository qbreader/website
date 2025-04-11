import { divisionChoices, packets } from '../../collections.js';

async function recordDivision (packetName, division, userId) {
  const packet = await packets.findOne({ name: packetName });
  return await divisionChoices.replaceOne(
    { user_id: userId, 'packet.name': packetName },
    { user_id: userId, packet: { _id: packet._id, name: packetName }, division },
    { upsert: true }
  );
}

export default recordDivision;
