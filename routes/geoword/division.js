import getUserId from '../../database/account-info/get-user-id.js';
import checkPayment from '../../database/geoword/check-payment.js';
import getDivisionChoice from '../../database/geoword/get-division-choice.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
  const { username } = req.session;
  const packetName = req.params.packetName;
  const user_id = await getUserId(username);

  const divisionChoice = await getDivisionChoice(packetName, user_id);

  if (divisionChoice) {
    res.redirect('/geoword/game/' + packetName);
    return;
  }

  const paid = await checkPayment(packetName, user_id);

  if (paid) {
    res.sendFile('division.html', { root: './client/geoword' });
    return;
  }

  res.redirect('/geoword/payment/' + packetName);
});

export default router;
