import { updateTossup, updateBonus } from '../../../../database/qbreader/admin/update-question.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/update-tossup', async (req, res) => {
  const { _id, question, answer } = req.body;

  if (typeof _id !== 'string') {
    return res.status(400).send('Missing or invalid _id');
  }

  let objectId;
  try { objectId = new ObjectId(_id); } catch (e) { return res.status(400).send('Invalid _id'); }

  if (question !== undefined && typeof question !== 'string') {
    return res.status(400).send('Invalid question field');
  }

  if (answer !== undefined && typeof answer !== 'string') {
    return res.status(400).send('Invalid answer field');
  }

  if (question === undefined && answer === undefined) {
    return res.status(400).send('No fields to update');
  }

  const result = await updateTossup(objectId, { question, answer });

  if (result === null) {
    return res.status(400).send('No fields to update');
  }

  if (result.matchedCount === 0) {
    return res.status(404).send('Tossup not found');
  }

  res.sendStatus(200);
});

router.put('/update-bonus', async (req, res) => {
  const { _id, leadin, parts, answers } = req.body;

  if (typeof _id !== 'string') {
    return res.status(400).send('Missing or invalid _id');
  }

  let objectId;
  try { objectId = new ObjectId(_id); } catch (e) { return res.status(400).send('Invalid _id'); }

  if (leadin !== undefined && typeof leadin !== 'string') {
    return res.status(400).send('Invalid leadin field');
  }

  if (parts !== undefined) {
    if (!Array.isArray(parts) || parts.some(p => typeof p !== 'string')) {
      return res.status(400).send('Invalid parts field');
    }
  }

  if (answers !== undefined) {
    if (!Array.isArray(answers) || answers.some(a => typeof a !== 'string')) {
      return res.status(400).send('Invalid answers field');
    }
  }

  if (leadin === undefined && parts === undefined && answers === undefined) {
    return res.status(400).send('No fields to update');
  }

  const result = await updateBonus(objectId, { leadin, parts, answers });

  if (result === null) {
    return res.status(400).send('No fields to update');
  }

  if (result.matchedCount === 0) {
    return res.status(404).send('Bonus not found');
  }

  res.sendStatus(200);
});

export default router;
