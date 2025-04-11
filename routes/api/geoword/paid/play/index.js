import audioRouter from './audio.js';
import checkAnswerRouter from './check-answer.js';
import divisionChoiceRouter from './division-choice.js';
import getProgressRouter from './get-progress.js';
import getQuestionCountRouter from './get-question-count.js';
import recordBuzzRouter from './record-buzz.js';
import recordDivisionRouter from './record-division.js';
import recordProtestRouter from './record-protest.js';

import { Router } from 'express';

const router = Router();

router.use('/audio', audioRouter);
router.use('/check-answer', checkAnswerRouter);
router.use('/division-choice', divisionChoiceRouter);
router.use('/get-progress', getProgressRouter);
router.use('/get-question-count', getQuestionCountRouter);
router.use('/record-buzz', recordBuzzRouter);
router.use('/record-division', recordDivisionRouter);
router.use('/record-protest', recordProtestRouter);

export default router;
