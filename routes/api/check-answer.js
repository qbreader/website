import { Router } from 'express';
import checkAnswer from 'qb-answer-checker';

const router = Router();

router.get('/', (req, res) => {
  const { answerline, givenAnswer, strictness } = req.query;
  const { directive, directedPrompt } = checkAnswer(answerline, givenAnswer, strictness);
  res.json({ directive, directedPrompt });
});

export default router;
