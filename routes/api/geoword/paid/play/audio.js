import getAudio from '../../../../../database/geoword/paid/play/get-audio.js';
import getSampleAudio from '../../../../../database/geoword/paid/play/get-sample-audio.js';

import { Router } from 'express';

const router = Router();

router.get('/question.mp3', async (req, res) => {
  const { packetName, division, questionNumber } = req.query;
  try {
    const audio = await getAudio({ packetName, division, questionNumber: parseInt(questionNumber) });
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
