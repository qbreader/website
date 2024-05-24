import { Router } from 'express';
import getTossup from '../../database/qbreader/get-tossup.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  if (!req.query.id) {
    res.status(400).send('Tossup ID not specified');
    return;
  }
  let oid;
  try {
    oid = ObjectId(req.query.id);
  } catch (b) {
    res.status(400).send('Invalid Tossup ID');
    return;
  }
  const tossup = await getTossup(oid);
  if (tossup === null) {
    res.status(404).send(`Tossup with ID ${req.query.id} was not found`);
    return;
  }

  res.header('Access-Control-Allow-Origin', '*');
  res.json({ tossup });
});

export default router;
