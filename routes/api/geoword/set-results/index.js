import getUser from '../../../../database/account-info/get-user.js';
import getCategoryLeaderboard from '../../../../database/geoword/paid/results/get-category-stats.js';
import getBuzzCount from '../../../../database/geoword/get-buzz-count.js';
import getPacketsForSetStats from '../../../../database/geoword/get-packets-for-set-stats.js';
import getQuestionCount from '../../../../database/geoword/get-question-count.js';
import getSet from '../../../../database/geoword/get-set.js';
import getSetLeaderboard from '../../../../database/geoword/paid/results/get-set-leaderboard.js';
import getSetTeamLeaderboard from '../../../../database/geoword/paid/results/get-set-team-leaderboard.js';
import hasPacketPrivileges from '../../../../database/geoword/has-packet-privileges.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

/**
 * Cumulative stats only cover packets without `excludeFromSetStats`, and (as with a single packet's results) only
 * the ones the viewer has finished, or all of them for someone with packet privileges.
 */
router.use(async (req, res, next) => {
  const user = await getUser(req.session.username);
  if (!user) {
    return res.status(401).send('You must log in first.');
  }

  const { setName } = validate(req.query, { setName: rules.string() });
  const set = await getSet(setName);
  if (!set) {
    return res.status(404).send('That set does not exist.');
  }

  const setStatsPacketNames = await getPacketsForSetStats(set._id);
  const viewable = await Promise.all(setStatsPacketNames.map(async packetName => {
    if (await hasPacketPrivileges(packetName, user._id)) { return true; }
    const [buzzCount, questionCount] = await Promise.all([getBuzzCount(packetName, user._id), getQuestionCount(packetName)]);
    return buzzCount >= questionCount;
  }));

  res.locals.packetNames = setStatsPacketNames.filter((_, index) => viewable[index]);
  res.locals.userId = user._id;
  res.locals.username = user.username;
  if (res.locals.packetNames.length === 0) {
    return res.status(403).send('You must finish a packet that counts toward this set before viewing its cumulative stats.');
  }

  next();
});

router.get('/category-stats', async (req, res) => {
  const { packetNames, username } = res.locals;
  const leaderboards = await getCategoryLeaderboard({ packetNames });
  res.json({ leaderboards, username, packetNames });
});

router.get('/leaderboard', async (req, res) => {
  const { packetNames } = res.locals;
  const leaderboard = await getSetLeaderboard({ packetNames });
  res.json({ leaderboard, packetNames });
});

router.get('/team-leaderboard', async (req, res) => {
  const { packetNames, userId } = res.locals;
  const standings = await getSetTeamLeaderboard({ packetNames, viewerId: userId });
  const teamLeaderboard = Object.fromEntries(Object.entries(standings).map(([division, teams]) => {
    const rows = teams.map(({ matches, playerPoints, ...row }) => row);
    return [division, rows];
  }));
  res.json({ teamLeaderboard, packetNames });
});

export default router;
