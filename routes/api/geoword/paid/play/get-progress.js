import { buzzes } from '../../../../../database/geoword/collections.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';
import getUserId from '../../../../../database/account-info/get-user-id.js';
import { Router } from 'express';

async function getProgress (packetName, userId) {
  const result = await buzzes.aggregate([
    { $match: { 'packet.name': packetName, user_id: userId } },
    {
      $group: {
        _id: null,
        numberCorrect: { $sum: { $cond: [{ $gt: ['$points', 0] }, 1, 0] } },
        points: { $sum: '$points' },
        totalCorrectCelerity: { $sum: { $cond: [{ $gt: ['$points', 0] }, '$celerity', 0] } },
        tossupsHeard: { $sum: 1 }
      }
    }
  ]).toArray();

  result[0] = result[0] || {};
  result[0].division = await getDivisionChoice(packetName, userId);
  return result[0];
}


const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const { division, numberCorrect, points, totalCorrectCelerity, tossupsHeard } = await getProgress(packetName, userId);
  res.json({ division, numberCorrect, points, totalCorrectCelerity, tossupsHeard });
});

export default router;
