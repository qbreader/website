import { payments } from '../../../../database/geoword/collections.js';
import { getUsername } from '../../../auth/get-username.js';

export default async function getInvoice ({ _id }) {
  const payment = await payments.findOne({ _id }, { sort: { createdAt: -1 } });

  if (payment) {
    payment.username = await getUsername(payment.user_id);
  }

  return payment;
}
