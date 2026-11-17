import getQuestionBuzzes from '../../../../database/geoword/admin/get-question-buzzes.js';
import validateInt from '../../../validators/int.js';
import validateString from '../../../validators/string.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  validateString(req.query, 'division');
  validateInt(req.query, 'questionNumber', { defaultValue: 1, lowerBound: 1 });
  const { packetName, division, questionNumber } = req.query;

  const buzzes = await getQuestionBuzzes({ packetName, division, questionNumber });
  res.json({ buzzes });
});

export default router;
