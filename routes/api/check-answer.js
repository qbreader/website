import checkAnswer from '../../qb-answer-checker/check-answer.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    const { answerline, givenAnswer } = req.query;
    const { directive, directedPrompt } = checkAnswer(answerline, givenAnswer);
    res.header('Access-Control-Allow-Origin', '*');
    res.json({ directive, directedPrompt });
});

export default router;
