import getUsername from '../../../account-info/get-username.js';
import getQuestionCount from '../../get-question-count.js';
import getTeamBuzzes from './get-team-buzzes.js';

/**
 * @param {Object} options
 * @param {String} options.packetName
 * @param {String} options.division
 * @param {Object} options.team
 * @param {ObjectId} options.viewerId
 * @returns {Promise<{ teamName: string, division: string, questionCount: number, members: Object[], questions: Object[] }>}
 */
async function getTeamView ({ packetName, division, team, viewerId }) {
  const [teamBuzzes, questionCount] = await Promise.all([
    getTeamBuzzes({ packetName, division, team }),
    getQuestionCount(packetName, division)
  ]);

  const members = await Promise.all(team.members.map(async member => ({
    username: await getUsername(member),
    isYou: member.equals(viewerId),
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

  return { teamName: team.teamName, division, questionCount, members, questions };
}

export default getTeamView;
