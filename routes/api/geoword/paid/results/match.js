import getMatch from '../../../../../database/geoword/paid/results/get-match.js';
import validateString from '../../../../validators/string.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  for (const field of ['packetName', 'division', 'teamA', 'teamB']) {
    req.query = validateString(req.query, field);
  }
  const { packetName, division, teamA, teamB } = req.query;

  if (!teamA || !teamB || teamA === teamB) {
    res.status(400).send('Choose two different teams.');
    return;
  }

  const match = await getMatch({ packetName, division, teamNames: [teamA, teamB] });
  if (match === null) {
    res.status(404).send('Both teams must have played this division.');
    return;
  }

  res.json({ match });
});

export default router;
