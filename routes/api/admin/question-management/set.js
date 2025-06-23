import updateSetDifficulty from '../../../../database/qbreader/admin/update-set-difficulty.js';

import { Router } from 'express';
import { DIFFICULTIES } from '../../../../quizbowl/constants.js';

const router = Router();

router.put('/update-difficulty', async (req, res) => {
  const { setName, difficulty } = req.body;

  if (typeof setName !== 'string' || typeof difficulty !== 'number') {
    return res.sendStatus(400);
  }

  if (!DIFFICULTIES.includes(difficulty)) {
    return res.status(400).send('Invalid difficulty level');
  }

  const result = await updateSetDifficulty(setName, difficulty);

  if (result) {
    res.sendStatus(200);
  } else {
    res.status(404).send('Set not found');
  }
});

export default router;
