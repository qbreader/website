import { buzzes, packets } from '../../collections.js';
import areTeamsEnabled from '../../are-teams-enabled.js';
import getDivisionChoice from '../../get-division-choice.js';

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
  result[0].scoring = (await packets.findOne({ name: packetName }, { projection: { scoring: 1 } }))?.scoring;
  result[0].teamsEnabled = await areTeamsEnabled({ packetName });
  return result[0];
}

export default getProgress;
