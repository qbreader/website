import getSets from '../../database/qbreader/get-sets.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const setNames = req.query.setNames ? req.query.setNames.split(',') : undefined;
  const packetNumbers = req.query.packetNumbers ? req.query.packetNumbers.split(',').map(numStr => parseInt(numStr)) : undefined;
  const categories = req.query.categories ? req.query.categories.split(',') : undefined;
  const subcategories = req.query.subcategories ? req.query.subcategories.split(',') : undefined;
  const questionType = req.query.questionType || 'tossup';
  const reverse = req.query.reverse === 'true';
  const questions = await getSets({ setNames, packetNumbers, categories, subcategories, questionType, reverse });
  res.json({ questions });
});

router.post('/', async (req, res) => {
  const { setNames, packetNumbers, categories, subcategories, questionType, reverse } = req.body;
  const questions = await getSets({ setNames, packetNumbers, categories, subcategories, questionType, reverse });
  res.json({ questions });
});

export default router;
