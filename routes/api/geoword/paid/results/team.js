import getUsername from '../../../../../database/account-info/get-username.js';
import getUserId from '../../../../../database/account-info/get-user-id.js';
import getBuzzCount from '../../../../../database/geoword/get-buzz-count.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';
import getQuestionCount from '../../../../../database/geoword/get-question-count.js';
import hasPacketPrivileges from '../../../../../database/geoword/has-packet-privileges.js';
import getTeam from '../../../../../database/geoword/get-team.js';
import getTeamBuzzes from '../../../../../database/geoword/paid/results/get-team-buzzes.js';
import { packets, teams } from '../../../../../database/geoword/collections.js';

import { Router } from 'express';

const router = Router();

/**
 * How everyone on the player's team did on each question of a packet.
 * Only for a player on a team in the packet's set who has finished the packet themselves, in
 * the team's division: the answerlines are in the response. This is stricter than the results
 * router, which also lets packet admins through.
 *
 * Packet admins (admins and the packet's special users) can instead pass a `teamName` to view
 * any team in the packet's set, whether or not they are on it or have finished.
 */
router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const userId = await getUserId(req.session.username);

  const packet = await packets.findOne({ name: packetName }, { projection: { set: 1 } });
  const adminView = typeof req.query.teamName === 'string' && await hasPacketPrivileges(packetName, userId);
  const team = !packet?.set
    ? null
    : adminView
      ? await teams.findOne({ 'set._id': packet.set._id, teamName: req.query.teamName }, { collation: { locale: 'en', strength: 2 } })
      : await getTeam(packet.set._id, userId);
  if (!team) {
    return res.status(404).send(adminView ? 'No team has that name.' : 'You are not on a team for this packet.');
  }

  const questionCount = await getQuestionCount(packetName, team.division);
  if (!adminView) {
    const [division, buzzCount] = await Promise.all([
      getDivisionChoice(packetName, userId),
      getBuzzCount(packetName, userId)
    ]);
    if (division !== team.division) {
      return res.status(403).send('Your division for this packet is not your team\'s division.');
    }
    if (buzzCount < questionCount) {
      return res.status(403).send('You must finish the packet before viewing your team.');
    }
  }

  const teamBuzzes = await getTeamBuzzes({ packetName, team });
  const members = await Promise.all(team.members.map(async member => ({
    username: await getUsername(member),
    isYou: String(member) === String(userId),
    buzzCount: teamBuzzes.filter(question => question.buzzes.some(buzz => String(buzz.user_id) === String(member))).length
  })));

  const questions = await Promise.all(teamBuzzes.map(async question => ({
    questionNumber: question.questionNumber,
    answer: question.answer_sanitized,
    buzzes: await Promise.all(question.buzzes.map(async buzz => ({
      username: await getUsername(buzz.user_id),
      givenAnswer: buzz.givenAnswer,
      points: buzz.points,
      celerity: buzz.celerity
    })))
  })));

  res.json({
    teamName: team.teamName,
    division: team.division,
    questionCount,
    members: members.map(({ username, isYou, buzzCount }) => ({ username, isYou, finished: buzzCount >= questionCount })),
    questions
  });
});

export default router;
