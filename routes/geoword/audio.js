import getAudio from '../../database/geoword/get-audio.js';

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

router.get('/game/:packetName/:division/:questionNumber.mp3', async (req, res) => {
  const { packetName, division, questionNumber } = req.params;
  try {
    const audio = await getAudio({ packetName, division, questionNumber: parseInt(questionNumber) });
    res.send(audio);
  } catch (error) {
    res.status(404).send('Audio not found');
  }
});

router.get('/*.mp3', (req, res) => {
  res.sendFile(req.url, { root: './client/geoword-audio' });
});

export default router;
