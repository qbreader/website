import { Router } from 'express';
import checkAnswer from 'qb-answer-checker';

const router = Router();

router.get('/', (req, res) => {
  const { answerline, givenAnswer } = req.query;
  const { directive, directedPrompt } = checkAnswer(answerline, givenAnswer);
  res.json({ directive, directedPrompt });
});

export default router;
