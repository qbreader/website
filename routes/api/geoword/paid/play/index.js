import audioRouter from './audio.js';
import checkAnswerRouter from './check-answer.js';
import divisionChoiceRouter from './division-choice.js';
import getInstructionsRouter from './get-instructions.js';
import getProgressRouter from './get-progress.js';
import getQuestionCountRouter from './get-question-count.js';
import recordBuzzRouter from './record-buzz.js';
import recordDivisionRouter from './record-division.js';
import recordProtestRouter from './record-protest.js';
import requireCurrentQuestion from './require-current-question.js';
import useDivisionChoice from './use-division-choice.js';

import { Router } from 'express';

const router = Router();

router.use(['/audio/question.mp3', '/check-answer', '/get-instructions', '/record-buzz'], requireCurrentQuestion);
router.use(['/audio/question.mp3', '/check-answer', '/get-instructions'], useDivisionChoice);

router.use('/audio', audioRouter);
router.use('/check-answer', checkAnswerRouter);
router.use('/division-choice', divisionChoiceRouter);
router.use('/get-instructions', getInstructionsRouter);
router.use('/get-progress', getProgressRouter);
router.use('/get-question-count', getQuestionCountRouter);
router.use('/record-buzz', recordBuzzRouter);
router.use('/record-division', recordDivisionRouter);
router.use('/record-protest', recordProtestRouter);

export default router;
