import { Router } from 'express';
import getBonus from '../../database/qbreader/get-bonus.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  if (!req.query._id && req.query.id) { req.query._id = req.query.id; }
  if (!req.query._id) { return res.status(400).send('Bonus ID not specified'); }
  let _id;
  try { _id = new ObjectId(req.query._id); } catch (b) { return res.status(400).send('Invalid Bonus ID'); }
  const bonus = await getBonus(_id);
  if (bonus === null) {
    return res.status(404).send(`Bonus with ID ${req.query._id} was not found`);
  }

  res.json({ bonus });
});

export default router;
