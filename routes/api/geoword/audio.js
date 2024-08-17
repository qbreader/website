import getAudio from '../../../database/geoword/get-audio.js';
import checkPayment from '../../../database/geoword/check-payment.js';
import getUserId from '../../../database/account-info/get-user-id.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName/sample.mp3', async (req, res) => {
  const { packetName } = req.params;
  try {
    const audio = await getAudio({ packetName, sample: true });
    res.send(audio);
  } catch (error) {
    res.status(404).send('Audio not found');
  }
});

router.get('/:packetName/:division/:questionNumber.mp3', async (req, res) => {
  const { packetName, division, questionNumber } = req.params;
  const { username } = req.session;
  const userId = await getUserId(username);
  const paid = await checkPayment(packetName, userId);

  if (!paid) {
    res.status(403).send('Payment required');
    return;
  }

  try {
    const audio = await getAudio({ packetName, division, questionNumber: parseInt(questionNumber) });
    res.send(audio);
  } catch (error) {
    res.status(404).send('Audio not found');
  }
});

export default router;
