import getAnswer from '../../../../../database/geoword/paid/play/get-answer.js';

import { Router } from 'express';
import checkAnswer from 'qb-answer-checker';

const router = Router();

router.get('/', async (req, res) => {
  const { givenAnswer, questionNumber, packetName, division } = req.query;
  const answer = await getAnswer(packetName, division, parseInt(questionNumber));
  const { directive, directedPrompt } = checkAnswer(answer, givenAnswer);
  res.json({ actualAnswer: answer, directive, directedPrompt });
});

export default router;
