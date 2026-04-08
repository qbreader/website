import { divisionChoices, packets } from '../../../../../database/geoword/collections.js';
import getUserId from '../../../../../database/account-info/get-user-id.js';
import { Router } from 'express';

async function recordDivision (packetName, division, userId) {
  const packet = await packets.findOne({ name: packetName });
  return await divisionChoices.replaceOne(
    { user_id: userId, 'packet.name': packetName },
    { user_id: userId, packet: { _id: packet._id, name: packetName }, division },
    { upsert: true }
  );
}


const router = Router();

router.put('/', async (req, res) => {
  const { username } = req.session;
  const { packetName, division } = req.query;
  const userId = await getUserId(username);
  const result = await recordDivision(packetName, division, userId);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
