import * as validateArray from '../validators/array.js';
import * as validateBoolean from '../validators/boolean.js';
import * as validateEnum from '../validators/enum.js';
import * as validateInt from '../validators/int.js';
import validateCategoryBundle from '../validators/category-bundle.js';

import { MAX_QUERY_RETURN_LENGTH, MIN_YEAR } from '../../quizbowl/constants.js';
import getQuery from '../../database/qbreader/get-query.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateArray.difficulties(req.query);
  req.query = validateBoolean.caseSensitive(req.query);
  req.query = validateBoolean.exactPhrase(req.query);
  req.query = validateBoolean.ignoreWordOrder(req.query);
  req.query = validateBoolean.powermarkOnly(req.query);
  req.query = validateBoolean.randomize(req.query);
  req.query = validateBoolean.regex(req.query);
  req.query = validateEnum.questionType(req.query);
  req.query = validateEnum.searchType(req.query);
  req.query = validateInt.bonusPagination(req.query);
  req.query = validateInt.maxReturnLength(req.query);
  req.query = validateInt.maxYear(req.query);
  req.query = validateInt.minYear(req.query, MIN_YEAR);
  req.query = validateInt.tossupPagination(req.query);
  req.query = validateCategoryBundle(req.query);

  if (req.query.setName) {
    req.query.setName = req.query.setName.split(',').map(s => s.trim());
  }

  const maxPagination = Math.floor(MAX_QUERY_RETURN_LENGTH / req.query.maxReturnLength);

  // bound pagination between 1 and maxPagination
  req.query.tossupPagination = Math.min(parseInt(req.query.tossupPagination), maxPagination);
  req.query.bonusPagination = Math.min(parseInt(req.query.bonusPagination), maxPagination);
  req.query.tossupPagination = Math.max(req.query.tossupPagination, 1);
  req.query.bonusPagination = Math.max(req.query.bonusPagination, 1);

  try {
    const queryResult = await getQuery(req.query);
    res.json(queryResult);
  } catch (error) {
    switch (error.message) {
      case 'Invalid question type specified.':
        res.status(400).send('Invalid question type specified.');
        return;
      case 'Invalid search type specified.':
        res.status(400).send('Invalid search type specified.');
        return;
      default:
        console.log(error);
        res.sendStatus(500);
    }
  }
});

export default router;
