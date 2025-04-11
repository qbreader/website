import getQuestionCount from '../../../../../database/geoword/get-question-count.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division } = req.query;
  const questionCount = await getQuestionCount(packetName, division);
  res.json({ questionCount });
});

export default router;
