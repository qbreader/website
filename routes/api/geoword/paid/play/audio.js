import getUserId from '../../../../../database/account-info/get-user-id.js';
import getAudio from '../../../../../database/geoword/get-audio.js';
import getSampleAudio from '../../../../../database/geoword/paid/play/get-sample-audio.js';
import logPlayEvent from '../../../../../database/geoword/paid/play/log-play-event.js';

import { Router } from 'express';

const router = Router();

router.get('/question.mp3', async (req, res) => {
  const { packetName, division, questionNumber } = req.query;
  try {
    const audio = await getAudio({ packetName, division, questionNumber });

    const userId = await getUserId(req.session.username);
    logPlayEvent({ type: 'audio', packetName, questionNumber, userId }).catch(console.error);

    res.send(audio);
  } catch (error) {
    res.status(404).send('Audio not found');
  }
});

router.get('/sample.mp3', async (req, res) => {
  const { packetName } = req.query;
  try {
    const audio = await getSampleAudio({ packetName });
    res.send(audio);
  } catch (error) {
    res.status(404).send('Audio not found');
  }
});

export default router;
