import { payments } from '../collections.js';
import getUsername from '../../account-info/get-username.js';
import getSetPayment from '../get-set-payment.js';

export default async function getPaymentList ({ packetName }) {
  const setPayment = await getSetPayment(packetName);
  const filter = setPayment
    ? { 'set._id': setPayment.set._id, packet: { $exists: false } }
    : { 'packet.name': packetName };

  const paymentsList = await payments.find(filter, { sort: { createdAt: -1 } }).toArray();

  for (const payment of paymentsList) {
    payment.username = await getUsername(payment.user_id);
  }

  return paymentsList;
}
