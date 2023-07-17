import { Router } from 'express';

const router = Router();

router.get('/*.mp3', (req, res) => {
    res.sendFile(req.url, { root: './geoword-audio' });
});

router.get('/', (req, res) => {
    const { packetName, division, currentQuestionNumber } = req.query;
    res.sendFile(`${packetName}/${division}/${currentQuestionNumber}.mp3`, { root: './geoword-audio' });
});

export default router;
