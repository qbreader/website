import getUserId from '../../../../database/account-info/get-user-id.js';
import getDivisionChoice from '../../../../database/geoword/get-division-choice.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res, next) => {
  const { username } = req.session;
  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const divisionChoice = await getDivisionChoice(packetName, userId);

  if (divisionChoice) {
    return res.redirect(`/geoword/paid/play/game?packetName=${packetName}`);
  }

  next();
});

export default router;
