import { buzzes, packets, tossups } from '../../../../../database/geoword/collections.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';
import isAdminById from './is-admin-by-id.js';
import getUserId from '../../../../../database/account-info/get-user-id.js';
import { Router } from 'express';

/**
 * @param {Object} params
 * @param {Decimal} params.celerity
 * @param {String} params.givenAnswer
 * @param {Boolean} params.isCorrect
 * @param {String} params.packetName
 * @param {Number} params.questionNumber
 * @param {ObjectId} params.user_id
 * @param {String[]} params.prompts - whether or not the buzz is a prompt
 */
async function recordBuzz ({ celerity, givenAnswer, packetName, points, prompts, questionNumber, userId }) {
  const [admin, division, packet, tossup] = await Promise.all([
    isAdminById(userId),
    getDivisionChoice(packetName, userId),
    packets.findOne({ name: packetName }),
    tossups.findOne({ 'packet.name': packetName, questionNumber })
  ]);

  const insertDocument = {
    active: packet.active && !admin,
    celerity,
    division,
    givenAnswer,
    points,
    packet: {
      _id: packet._id,
      name: packet.name
    },
    questionNumber,
    tossup_id: tossup._id,
    user_id: userId
  };

  if (prompts && typeof prompts === 'object' && prompts.length > 0) {
    insertDocument.prompts = prompts;
  }

  return await buzzes.insertOne(insertDocument);
}

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;

  req.query.celerity = parseFloat(req.query.celerity);
  req.query.points = parseInt(req.query.points);
  req.query.questionNumber = parseInt(req.query.questionNumber);
  if (req.query.prompts) {
    req.query.prompts = req.query.prompts.split(',');
  }

  const userId = await getUserId(username);
  const { celerity, givenAnswer, packetName, points, prompts, questionNumber } = req.query;
  const result = await recordBuzz({ celerity, givenAnswer, packetName, points, prompts, questionNumber, userId });

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
