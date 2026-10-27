import { packets, payments } from './collections.js';

import getSetPayment from './get-set-payment.js';

async function recordPayment (packetName, userId, manual = false) {
  const setPayment = await getSetPayment(packetName);
  if (setPayment) {
    return await payments.replaceOne(
      { user_id: userId, 'set._id': setPayment.set._id, packet: { $exists: false } },
      { user_id: userId, set: setPayment.set, createdAt: new Date(), manual },
      { upsert: true }
    );
  }

  const packet = await packets.findOne({ name: packetName });
  return await payments.replaceOne(
    { user_id: userId, 'packet.name': packetName },
    { user_id: userId, packet: { _id: packet._id, name: packetName }, set: packet.set, createdAt: new Date(), manual },
    { upsert: true }
  );
}

export default recordPayment;
