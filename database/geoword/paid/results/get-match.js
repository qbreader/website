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
 * @param {ObjectId} options.userId
 * @param {number} options.side - the index of the player's team
 * @param {Buzz[]} options.heard - the player's buzzes, one per question heard
 * @param {QuestionResult[]} options.questionResults
 * @returns {Promise<PlayerStats>}
 */
async function getPlayerStats ({ userId, side, heard, questionResults }) {
  /** @type {number[]} */
  const scores = questionResults
    .filter(result => result.buzzes[side]?.user_id.equals(userId))
    .map(result => result.points[side]);

  return {
    username: await getUsername(userId),
    tossupsHeard: heard.length,
    numberCorrect: scores.filter(score => score > 0).length,
    numberNegs: scores.filter(score => score < 0).length,
    points: scores.reduce((total, score) => total + score, 0)
  };
}

/**
 * @param {Object} options
 * @param {Object} options.team - a document from the `teams` collection
 * @param {number} options.side - the team's index in the match
 * @param {Buzz[]} options.teamBuzzes - the buzzes of the team's finished members
 * @param {QuestionResult[]} options.questionResults
 * @returns {Promise<PlayerStats[]>} the stats of each member with buzzes, in team order
 */
async function getTeamPlayerStats ({ team, side, teamBuzzes, questionResults }) {
  const players = team.members
    .map(userId => ({ userId, heard: teamBuzzes.filter(buzz => buzz.user_id.equals(userId)) }))
    .filter(({ heard }) => heard.length > 0);

  return await Promise.all(players.map(({ userId, heard }) => getPlayerStats({ userId, side, heard, questionResults })));
}

/**
 * @param {Buzz | undefined} buzz
 * @param {number} points - what the buzz scored in the match
 * @returns {Promise<MatchBuzz | null>}
 */
async function toMatchBuzz (buzz, points) {
  if (!buzz) { return null; }
  const { user_id: userId, celerity, givenAnswer } = buzz;
  return { username: await getUsername(userId), celerity, givenAnswer, points };
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

  /** @type {Buzz[][]} each team's buzzes, from its finished members only */
  const finishedBuzzes = teams.map(team => {
    const memberBuzzes = team.members.map(userId => divisionBuzzes.filter(buzz => buzz.user_id.equals(userId)));
    return getBuzzesOfFinishedMembers({ memberBuzzes, questionCount });
  });
  if (finishedBuzzes.some(teamBuzzes => teamBuzzes.length === 0)) { return null; }

  const [firstTeamBuzzes, secondTeamBuzzes] = finishedBuzzes.map(groupBuzzesByQuestion);
  const { points, questions: questionResults } = simulateMatch(firstTeamBuzzes, secondTeamBuzzes);

  /** @type {MatchTeam[]} */
  const matchTeams = await Promise.all(teams.map(async (team, side) => ({
    teamName: team.teamName,
    points: points[side],
    players: await getTeamPlayerStats({ team, side, teamBuzzes: finishedBuzzes[side], questionResults })
  })));

  /** @type {Map<number, string>} */
  const answers = new Map(tossups.map(tossup => [tossup.questionNumber, tossup.answer]));

  /** @type {MatchQuestion[]} */
  const matchQuestions = await Promise.all(questionResults.map(async ({ questionNumber, buzzes: decidingBuzzes, points: scores }) => ({
    questionNumber,
    answer: answers.get(questionNumber) ?? '',
    sides: await Promise.all(decidingBuzzes.map((buzz, side) => toMatchBuzz(buzz, scores[side])))
  })));

  return { teams: matchTeams, questions: matchQuestions };
}

export default getMatch;
