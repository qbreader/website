import updateSubcategory from '../../../database/qbreader/admin/update-subcategory.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  let { _id, type, subcategory, alternate_subcategory: alternateSubcategory } = req.body;
  try { _id = new ObjectId(_id); } catch (e) { return res.status(400).send('Invalid ID'); }
  const result = await updateSubcategory(_id, type, subcategory, alternateSubcategory);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
