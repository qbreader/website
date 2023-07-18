import { getAudio } from '../../database/geoword.js';

import { Router } from 'express';

const router = Router();

router.get('/*.mp3', (req, res) => {
    res.sendFile(req.url, { root: './geoword-audio' });
});

router.get('/', async (req, res) => {
    const { packetName, division, currentQuestionNumber } = req.query;
    const audio = await getAudio(packetName, division, parseInt(currentQuestionNumber));
    res.send(audio);
});

export default router;
