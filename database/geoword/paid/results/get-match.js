import { buzzes } from '../../collections.js';
import getUsername from '../../../account-info/get-username.js';
import getQuestionCount from '../../get-question-count.js';
import getPacket from './get-packet.js';
import getFinishedBuzzes from '../../../../server/geoword/get-finished-buzzes.js';
import { groupBuzzesByQuestion } from '../../../../server/geoword/merge-buzzes.js';
import simulateMatch from '../../../../server/geoword/simulate-match.js';

/**
 * The simulated match between two teams, question by question, scored as in the team standings.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {String} options.division
 * @param {Object[]} options.teams - two documents from the `teams` collection
 * @returns {Promise<{ teams: Array<{ teamName: string, points: number }>, questions: Array<{ questionNumber: number, answer: string, sides: Array<{ username: string, celerity: number, givenAnswer: string, points: number } | null> }> } | null>}
 * `teams` and each question's `sides` are in the order given, and a side's `points` are what
 * its buzz scored in the match. null if either team has no member who has finished.
 */
async function getMatch ({ packetName, division, teams }) {
  const [buzzList, questionCount, tossups] = await Promise.all([
    buzzes.find({
      'packet.name': packetName,
      division,
      user_id: { $in: teams.flatMap(team => team.members) },
      active: true
    }).toArray(),
    getQuestionCount(packetName, division),
    getPacket(packetName, division)
  ]);

  const [a, b] = teams.map(team => groupBuzzesByQuestion(getFinishedBuzzes({
    memberBuzzes: team.members.map(member => buzzList.filter(buzz => buzz.user_id.equals(member))),
    questionCount
  })));
  if (a.size === 0 || b.size === 0) { return null; }

  const match = simulateMatch(a, b);
  const answers = new Map(tossups.map(tossup => [tossup.questionNumber, tossup.answer_sanitized]));

  const questions = await Promise.all(match.questions.map(async ({ questionNumber, buzzes, points }) => ({
    questionNumber,
    answer: answers.get(questionNumber) ?? '',
    sides: await Promise.all(buzzes.map(async (buzz, side) => buzz
      ? {
          username: await getUsername(buzz.user_id),
          celerity: buzz.celerity,
          givenAnswer: buzz.givenAnswer,
          points: points[side]
        }
      : null))
  })));

  return {
    teams: teams.map((team, side) => ({ teamName: team.teamName, points: match.points[side] })),
    questions
  };
}

export default getMatch;
