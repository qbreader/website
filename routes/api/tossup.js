import { Router } from 'express';
import getTossup from '../../database/qbreader/get-tossup.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  if (!req.query._id && req.query.id) { req.query._id = req.query.id; }
  if (!req.query._id) { return res.status(400).send('Tossup ID not specified'); }
  let _id;
  try { _id = new ObjectId(req.query._id); } catch (b) { return res.status(400).send('Invalid Tossup ID'); }
  const tossup = await getTossup(_id);
  if (tossup === null) {
    return res.status(404).send(`Tossup with ID ${req.query._id} was not found`);
  }

  res.json({ tossup });
});

export default router;
