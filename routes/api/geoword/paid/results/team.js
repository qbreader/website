import getUsername from '../../../../../database/account-info/get-username.js';
import getUserId from '../../../../../database/account-info/get-user-id.js';
import getBuzzCount from '../../../../../database/geoword/get-buzz-count.js';
import getDivisions from '../../../../../database/geoword/get-divisions.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';
import getQuestionCount from '../../../../../database/geoword/get-question-count.js';
import hasPacketPrivileges from '../../../../../database/geoword/has-packet-privileges.js';
import getPacketSet from '../../../../../database/geoword/get-packet-set.js';
import getTeam from '../../../../../database/geoword/get-team.js';
import getTeamByName from '../../../../../database/geoword/get-team-by-name.js';
import getTeamBuzzes from '../../../../../database/geoword/paid/results/get-team-buzzes.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const userId = await getUserId(req.session.username);

  const set = await getPacketSet(packetName);
  const adminView = typeof req.query.teamName === 'string' && await hasPacketPrivileges(packetName, userId);
  let team = null;
  if (set) {
    team = adminView ? await getTeamByName(set._id, req.query.teamName) : await getTeam(set._id, userId);
  }
  if (!team) {
    return res.status(404).send(adminView ? 'No team has that name.' : 'You are not on a team for this packet.');
  }

  let division;
  if (adminView) {
    const divisions = await getDivisions(packetName);
    division = divisions.includes(req.query.division) ? req.query.division : divisions[0];
  } else {
    division = await getDivisionChoice(packetName, userId);
  }
  const questionCount = await getQuestionCount(packetName, division);
  if (!adminView && await getBuzzCount(packetName, userId) < questionCount) {
    return res.status(403).send('You must finish the packet before viewing your team.');
  }

  const teamBuzzes = await getTeamBuzzes({ packetName, division, team });
  const members = await Promise.all(team.members.map(async member => ({
    username: await getUsername(member),
    isYou: member.equals(userId),
    finished: teamBuzzes.filter(question => question.buzzes.some(buzz => buzz.user_id.equals(member))).length >= questionCount
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
    division,
    questionCount,
    members,
    questions
  });
});

export default router;
