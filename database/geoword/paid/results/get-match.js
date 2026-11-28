import { buzzes } from '../../collections.js';
import getUsername from '../../../account-info/get-username.js';
import getQuestionCount from '../../get-question-count.js';
import getPacket from './get-packet.js';
import getBuzzesOfFinishedMembers from '../../../../server/geoword/get-buzzes-of-finished-members.js';
import { groupBuzzesByQuestion } from '../../../../server/geoword/merge-buzzes.js';
import simulateMatch from '../../../../server/geoword/simulate-match.js';

/**
 * @typedef {import('../../../../server/geoword/merge-buzzes.js').Buzz} Buzz
 * @typedef {import('../../../../server/geoword/simulate-match.js').QuestionResult} QuestionResult
 */

/**
 * What one player did in the match. Only buzzes that decided their team's result score.
 * @typedef {Object} PlayerStats
 * @property {string} username
 * @property {number} tossupsHeard
 * @property {number} numberCorrect - how many of their buzzes scored points
 * @property {number} numberNegs - how many of their buzzes lost points
 * @property {number} points
 */

/**
 * @typedef {Object} MatchTeam
 * @property {string} teamName
 * @property {number} points
 * @property {PlayerStats[]} players - the members who have finished
 */

/**
 * The buzz that decided a team's result on a question.
 * @typedef {Object} MatchBuzz
 * @property {string} username
 * @property {number} celerity
 * @property {string} givenAnswer
 * @property {number} points - what it scored in the match
 */

/**
 * @typedef {Object} MatchQuestion
 * @property {number} questionNumber
 * @property {string} answer - the packet's formatted HTML
 * @property {Array<MatchBuzz | null>} sides - each team's buzz, null if it didn't hear the question
 */

/**
 * @param {Object} options
 * @param {Object} options.team - a document from the `teams` collection
 * @param {number} options.side - the team's index in the match
 * @param {Buzz[]} options.teamBuzzes - the buzzes of the team's finished members
 * @param {QuestionResult[]} options.questionResults
 * @param {Map<string, string>} options.usernames - keyed by the string form of each user id
 * @returns {PlayerStats[]} the stats of each member with buzzes, in team order
 */
function getTeamPlayerStats ({ team, side, teamBuzzes, questionResults, usernames }) {
  const players = team.members.filter(userId => teamBuzzes.some(buzz => buzz.user_id.equals(userId)));

  return players.map(userId => {
    /** @type {number[]} */
    const scores = questionResults
      .filter(result => result.buzzes[side]?.user_id.equals(userId))
      .map(result => result.points[side]);

    return {
      username: usernames.get(String(userId)),
      tossupsHeard: teamBuzzes.filter(buzz => buzz.user_id.equals(userId)).length,
      numberCorrect: scores.filter(score => score > 0).length,
      numberNegs: scores.filter(score => score < 0).length,
      points: scores.reduce((total, score) => total + score, 0)
    };
  });
}

/**
 * The simulated match between two teams, question by question, scored as in the team standings.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {String} options.division
 * @param {Object[]} options.teams - two documents from the `teams` collection
 * @returns {Promise<{ teams: MatchTeam[], questions: MatchQuestion[] } | null>} `teams` and each
 * question's `sides` are in the order given. null if either team has no member who has finished
 */
async function getMatch ({ packetName, division, teams }) {
  const [divisionBuzzes, questionCount, tossups] = await Promise.all([
    buzzes.find({
      'packet.name': packetName,
      division,
      user_id: { $in: teams.flatMap(team => team.members) },
      active: true
    }).toArray(),
    getQuestionCount(packetName, division),
    getPacket(packetName, division)
  ]);

  const finishedBuzzes = teams.map(team => {
    const memberBuzzes = team.members.map(userId => divisionBuzzes.filter(buzz => buzz.user_id.equals(userId)));
    return getBuzzesOfFinishedMembers({ memberBuzzes, questionCount });
  });
  if (finishedBuzzes.some(teamBuzzes => teamBuzzes.length === 0)) { return null; }

  const [firstTeamBuzzes, secondTeamBuzzes] = finishedBuzzes.map(groupBuzzesByQuestion);
  const { points, questions: questionResults } = simulateMatch(firstTeamBuzzes, secondTeamBuzzes);

  /** @type {Map<string, string>} */
  const usernames = new Map(
    await Promise.all(teams
      .flatMap(team => team.members)
      .map(async userId => [String(userId), await getUsername(userId)]))
  );

  /** @type {MatchTeam[]} */
  const matchTeams = teams.map((team, side) => ({
    teamName: team.teamName,
    points: points[side],
    players: getTeamPlayerStats({ team, side, teamBuzzes: finishedBuzzes[side], questionResults, usernames })
  }));

  /** @type {Map<number, string>} */
  const answers = new Map(tossups.map(tossup => [tossup.questionNumber, tossup.answer]));

  /** @type {MatchQuestion[]} */
  const matchQuestions = questionResults.map(({ questionNumber, buzzes: decidingBuzzes, points: scores }) => ({
    questionNumber,
    answer: answers.get(questionNumber) ?? '',
    sides: decidingBuzzes.map((buzz, side) => buzz
      ? { username: usernames.get(String(buzz.user_id)), celerity: buzz.celerity, givenAnswer: buzz.givenAnswer, points: scores[side] }
      : null)
  }));

  return { teams: matchTeams, questions: matchQuestions };
}

export default getMatch;
