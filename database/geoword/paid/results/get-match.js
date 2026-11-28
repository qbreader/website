import { buzzes } from '../../collections.js';
import getUsername from '../../../account-info/get-username.js';
import getQuestionCount from '../../get-question-count.js';
import getPacket from './get-packet.js';
import getBuzzesOfFinishedMembers from '../../../../server/geoword/get-buzzes-of-finished-members.js';
import { groupBuzzesByQuestion } from '../../../../server/geoword/merge-buzzes.js';
import simulateMatch from '../../../../server/geoword/simulate-match.js';

/**
 * The simulated match between two teams, question by question, scored as in the team standings.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {String} options.division
 * @param {Object[]} options.teams - two documents from the `teams` collection
 * @returns {Promise<{ teams: Array<{ teamName: string, points: number, players: Array<{ username: string, tossupsHeard: number, numberCorrect: number, numberNegs: number, points: number }> }>, questions: Array<{ questionNumber: number, answer: string, sides: Array<{ username: string, celerity: number, givenAnswer: string, points: number } | null> }> } | null>}
 * `teams` and each question's `sides` are in the order given, and a side's `points` are what
 * its buzz scored in the match. `answer` is the packet's formatted HTML. `players` are the members who have finished. null if either team has no member who has finished.
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

  const finishedBuzzes = teams.map(team => getBuzzesOfFinishedMembers({
    memberBuzzes: team.members.map(member => buzzList.filter(buzz => buzz.user_id.equals(member))),
    questionCount
  }));
  const [a, b] = finishedBuzzes.map(groupBuzzesByQuestion);
  if (a.size === 0 || b.size === 0) { return null; }

  const match = simulateMatch(a, b);

  const players = await Promise.all(teams.map((team, side) => Promise.all(team.members
    .map(member => ({ member, heard: finishedBuzzes[side].filter(buzz => buzz.user_id.equals(member)) }))
    .filter(({ heard }) => heard.length > 0)
    .map(async ({ member, heard }) => {
      const scored = match.questions
        .filter(({ buzzes }) => buzzes[side]?.user_id.equals(member))
        .map(({ points }) => points[side]);
      return {
        username: await getUsername(member),
        tossupsHeard: heard.length,
        numberCorrect: scored.filter(points => points > 0).length,
        numberNegs: scored.filter(points => points < 0).length,
        points: scored.reduce((total, points) => total + points, 0)
      };
    }))));
  const answers = new Map(tossups.map(tossup => [tossup.questionNumber, tossup.answer]));

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
    teams: teams.map((team, side) => ({ teamName: team.teamName, points: match.points[side], players: players[side] })),
    questions
  };
}

export default getMatch;
