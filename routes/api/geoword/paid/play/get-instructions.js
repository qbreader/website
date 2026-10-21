import getInstructions from '../../../../../database/geoword/paid/play/get-instructions.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division, questionNumber } = req.query;
  const instructions = await getInstructions(packetName, division, questionNumber);
  res.json({ instructions });
});

export default router;
