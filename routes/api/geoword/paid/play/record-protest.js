import { buzzes } from '../../../../../database/geoword/collections.js';
import getUserId from '../../../../../database/account-info/get-user-id.js';
import { Router } from 'express';

async function recordProtest (packetName, questionNumber, userId) {
  return await buzzes.updateOne(
    { 'packet.name': packetName, questionNumber, user_id: userId },
    { $set: { pendingProtest: true } }
  );
}


const router = Router();

router.put('/', async (req, res) => {
  const { username } = req.session;
  req.query.questionNumber = parseInt(req.query.questionNumber);
  const { packetName, questionNumber } = req.query;
  const userId = await getUserId(username);
  const result = await recordProtest(packetName, questionNumber, userId);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
