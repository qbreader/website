import renameSet from '../../../../database/qbreader/admin/rename-set.js';
import updateSetDifficulty from '../../../../database/qbreader/admin/update-set-difficulty.js';
import updateSetStandardness from '../../../../database/qbreader/admin/update-set-standardness.js';
import { DIFFICULTIES } from '../../../../quizbowl/constants.js';

import { Router } from 'express';

const router = Router();

router.put('/rename-set', async (req, res) => {
  const { oldName, newName } = req.body;

  if (typeof oldName !== 'string' || typeof newName !== 'string') {
    return res.sendStatus(400);
  }

  const result = await renameSet(oldName, newName);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

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

router.put('/update-standard', async (req, res) => {
  const { setName, standard } = req.body;

  if (typeof setName !== 'string' || typeof standard !== 'boolean') {
    return res.sendStatus(400);
  }

  const result = await updateSetStandardness(setName, standard);

  if (result) {
    res.sendStatus(200);
  } else {
    res.status(404).send('Set not found');
  }
});

export default router;
