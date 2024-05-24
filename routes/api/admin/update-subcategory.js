import updateSubcategory from '../../../database/qbreader/update-subcategory.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  const { _id, type, subcategory, alternate_subcategory: alternateSubcategory } = req.body;
  const result = await updateSubcategory(new ObjectId(_id), type, subcategory, alternateSubcategory);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
