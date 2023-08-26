import { getAudio } from '../../database/geoword.js';

import { Router } from 'express';

const router = Router();

router.get('/game/:packetName/:division/:questionNumber.mp3', async (req, res) => {
    const { packetName, division, questionNumber } = req.params;
    const audio = await getAudio(packetName, division, parseInt(questionNumber));
    res.send(audio);
});

router.get('/*.mp3', (req, res) => {
    res.sendFile(req.url, { root: './geoword-audio' });
});

export default router;
