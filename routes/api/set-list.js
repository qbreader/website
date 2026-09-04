import * as validateBoolean from '../validators/boolean.js';
import * as validateInt from '../validators/int.js';
import getSetList from '../../database/qbreader/get-set-list.js';
import getSetMetadata from '../../database/qbreader/set-metadata-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateBoolean.expand(req.query);
  req.query = validateBoolean.includeCounts(req.query);
  req.query = validateInt.limit(req.query, { defaultValue: null });
  const setList = req.query.expand ? await getSetMetadata(req.query) : await getSetList();
  return res.json({ setList });
});

export default router;
