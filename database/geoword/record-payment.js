import { packets, payments } from './collections.js';

async function recordPayment (packetName, userId) {
  const packet = await packets.findOne({ name: packetName });
  return await payments.replaceOne(
    { user_id: userId, 'packet.name': packetName },
    { user_id: userId, packet: { _id: packet._id, name: packetName }, createdAt: new Date() },
    { upsert: true }
  );
}

export default recordPayment;
