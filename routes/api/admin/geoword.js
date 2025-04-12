import getUserId from '../../../database/account-info/get-user-id.js';
import getAdminStats from '../../../database/geoword/get-admin-stats.js';
import getBuzzes from '../../../database/geoword/get-buzzes.js';
import getCategoryLeaderboard from '../../../database/geoword/paid/results/get-category-stats.js';
import getLeaderboard from '../../../database/geoword/paid/results/get-leaderboard.js';
import getPlayerList from '../../../database/geoword/get-player-list.js';
import getProtests from '../../../database/geoword/get-protests.js';
import resolveProtest from '../../../database/geoword/resolve-protest.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/category-stats', async (req, res) => {
  const { packetName, division } = req.query;
  const leaderboard = await getCategoryLeaderboard(packetName, division, true);
  res.json({ leaderboard });
});

router.get('/compare', async (req, res) => {
  const { packetName, division, player1, player2 } = req.query;
  const player1Buzzes = await getBuzzes(packetName, division, await getUserId(player1));
  const player2Buzzes = await getBuzzes(packetName, division, await getUserId(player2));
  res.json({ player1Buzzes, player2Buzzes });
});

router.get('/leaderboard', async (req, res) => {
  req.query.includeInactive = req.query.includeInactive === 'true';
  const { packetName, includeInactive } = req.query;
  const leaderboard = await getLeaderboard({ packetName, includeInactive });
  res.json({ leaderboard });
});

router.get('/player-list', async (req, res) => {
  const { packetName, division } = req.query;
  const players = await getPlayerList(packetName, division);
  res.json({ players });
});

router.get('/protests', async (req, res) => {
  const { packetName, division } = req.query;
  const { protests, packet } = await getProtests(packetName, division);
  res.json({ protests, packet });
});

router.post('/resolve-protest', async (req, res) => {
  let { buzz_id: buzzId, decision, reason } = req.body;
  try { buzzId = new ObjectId(buzzId); } catch (e) { return res.status(400).send('Invalid buzz ID'); }
  const result = await resolveProtest(buzzId, decision, reason);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

router.get('/stats', async (req, res) => {
  const { packetName, division } = req.query;
  const stats = await getAdminStats(packetName, division);
  res.json({ stats });
});

export default router;
