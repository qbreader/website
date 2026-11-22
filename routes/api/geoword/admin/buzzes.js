import getQuestionBuzzes from '../../../../database/geoword/admin/get-question-buzzes.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division, questionNumber } = validate(req.query, {
    packetName: rules.string(),
    division: rules.string(),
    questionNumber: rules.int({ defaultValue: 1, lowerBound: 1 })
  });

  const buzzes = await getQuestionBuzzes({ packetName, division, questionNumber });
  res.json({ buzzes });
});

export default router;
