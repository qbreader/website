import { payments } from '../../../../database/geoword/collections.js';
import { getUsername } from '../../../auth/get-username.js';

export default async function getPaymentList ({ packetName }) {
  const paymentsList = await payments.find(
    { 'packet.name': packetName },
    { sort: { createdAt: -1 } }
  ).toArray();

  for (const payment of paymentsList) {
    payment.username = await getUsername(payment.user_id);
  }

  return paymentsList;
}
