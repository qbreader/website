import getUserId from '../../../../../database/account-info/get-user-id.js';
import getAnswer from '../../../../../database/geoword/paid/play/get-answer.js';
import logPlayEvent from '../../../../../database/geoword/paid/play/log-play-event.js';
import recordBuzz from '../../../../../database/geoword/paid/play/record-buzz.js';

import { Router } from 'express';
import checkAnswer from 'qb-answer-checker';

const router = Router();

router.get('/', async (req, res) => {
  const { givenAnswer, questionNumber, packetName, division } = req.query;
  const answer = await getAnswer(packetName, division, questionNumber);
  const { directive, directedPrompt } = checkAnswer(answer, givenAnswer);

  const userId = await getUserId(req.session.username);
  logPlayEvent({ type: 'check-answer', packetName, questionNumber, userId, givenAnswer, directive }).catch(console.error);

  if (directive === 'prompt') {
    return res.json({ actualAnswer: answer, directive, directedPrompt });
  }

  const celerity = Math.min(1, Math.max(0, parseFloat(req.query.celerity) || 0));
  const prompts = req.query.prompts ? req.query.prompts.split(',') : [];

  let saved = false;
  try {
    const isCorrect = directive === 'accept';
    saved = !!(await recordBuzz({ celerity, division, givenAnswer, isCorrect, packetName, prompts, questionNumber, userId }));
  } catch (error) {
    console.error(error);
  }

  res.json({ actualAnswer: answer, directive, directedPrompt, saved });
});

export default router;
