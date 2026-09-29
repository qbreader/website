// KSHSAA practice stats: upload MODAQ exports, get season-long team analytics.
//
// INSTALL
//   1. Save as   routes/kshsaa-stats.js
//   2. In app.js: import with the others, and put the app.use line IMMEDIATELY
//      ABOVE  app.use(indexRouter);  (must be AFTER cookieSession for login):
//        import kshsaaStatsRouter from './routes/kshsaa-stats.js';
//        app.use('/kshsaa-stats', kshsaaStatsRouter);
//        app.use(indexRouter);
//   3. Add to .env and to Render's Environment tab:
//        STATS_PASSWORD=somethingYourTeamKnows

import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { qbreader } from '../database/databases.js';
import { CATEGORIES, CATEGORY_BY_QUESTION } from './kshsaa-round.js';

const router = Router();
const games = qbreader.collection('kshsaa_games');
const roster = qbreader.collection('kshsaa_roster');

// Games read on this site send their own category list. Older games, and files
// exported from MODAQ elsewhere, fall back to the slot number - which is only
// right when the round came out at its full 16 questions.
const categoryFor = (n, explicit) =>
  (explicit && explicit[n - 1]) || CATEGORY_BY_QUESTION[n - 1] || 'Other';

// squads a rostered player can belong to (edit this list to match your season)
const SQUADS = ['Varsity Blue', 'Varsity Crimson', 'JV Blue', 'JV Crimson', 'JV Silver', 'Rotating / sub'];

// ---------- auth ----------

const authed = req => Boolean(req.session && req.session.kshsaaStats);
export const requireAuth = (req, res, next) =>
  authed(req) ? next() : res.status(401).json({ error: 'not logged in' });

// one shared password that never rotates is worth a guessing cap
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;
const loginAttempts = new Map();

function tooManyAttempts (ip) {
  const now = Date.now();
  if (loginAttempts.size > 1000) {
    for (const [key, entry] of loginAttempts) {
      if (now - entry.start > LOGIN_WINDOW_MS) loginAttempts.delete(key);
    }
  }
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.start > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > LOGIN_MAX;
}

router.post('/login', (req, res) => {
  const expected = process.env.STATS_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'STATS_PASSWORD is not set on the server' });
  if (tooManyAttempts(req.ip)) {
    return res.status(429).json({ error: 'too many attempts - wait fifteen minutes' });
  }
  if (!req.body || req.body.password !== expected) return res.status(403).json({ error: 'wrong password' });
  loginAttempts.delete(req.ip);
  req.session.kshsaaStats = true;
  res.json({ ok: true });
});
router.post('/logout', (req, res) => {
  if (req.session) req.session.kshsaaStats = false;
  res.json({ ok: true });
});
router.get('/me', (req, res) => res.json({ authed: authed(req) }));

// names for autocomplete elsewhere on the site: roster + anyone who has played
router.get('/names', requireAuth, async (req, res) => {
  const played = await games.distinct('buzzes.player');
  const listed = (await roster.find({}).toArray()).map(r => r.name);
  const seen = {};
  const names = [];
  for (const n of listed.concat(played)) {
    const key = String(n || '').trim().toLowerCase();
    if (!key || seen[key]) continue;
    seen[key] = true;
    names.push(String(n).trim());
  }
  res.json({ names: names.sort() });
});

// ---------- roster ----------

router.get('/roster', requireAuth, async (req, res) => {
  const list = await roster.find({}).sort({ name: 1 }).toArray();
  const played = await games.distinct('buzzes.player');
  const playedSet = {};
  played.forEach(n => { playedSet[String(n).trim().toLowerCase()] = true; });
  res.json({
    squads: SQUADS,
    roster: list.map(r => ({
      id: String(r._id),
      name: r.name,
      grade: r.grade ?? null,
      squad: r.squad || null,
      hasPlayed: Boolean(playedSet[r.name.trim().toLowerCase()])
    }))
  });
});

// bulk add: one player per line, optional grade ("Max Chen, 11" / "Max Chen 11")
router.post('/roster/add', requireAuth, async (req, res) => {
  try {
    const text = String((req.body && req.body.text) || '');
    const existing = await roster.find({}).toArray();
    const byKey = {};
    existing.forEach(r => { byKey[r.name.trim().toLowerCase()] = r; });

    // one round trip for the whole paste rather than one per line
    const ops = [];
    let added = 0; let updated = 0;
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;

      // "Name", "Name, 11", "Name, 11, JV 2", "Name, JV 2" all work
      const parts = line.split(',').map(s => s.trim()).filter(Boolean);
      const name = (parts.shift() || '').replace(/[,-]+$/, '').trim();
      if (!name) continue;
      let grade = null; let squad = null;
      for (const part of parts) {
        if (/^(9|10|11|12)(th)?$/i.test(part)) grade = Number(part.replace(/\D/g, ''));
        else {
          const hit = SQUADS.find(s => s.toLowerCase().replace(/[^a-z0-9]/g, '') ===
            part.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (hit) squad = hit;
        }
      }

      const key = name.toLowerCase();
      if (byKey[key]) {
        const set = {};
        if (grade != null && byKey[key].grade !== grade) set.grade = grade;
        if (squad && byKey[key].squad !== squad) set.squad = squad;
        if (Object.keys(set).length) {
          ops.push({ updateOne: { filter: { _id: byKey[key]._id }, update: { $set: set } } });
          Object.assign(byKey[key], set);
          updated++;
        }
      } else {
        ops.push({ insertOne: { document: { name, grade, squad, createdAt: new Date() } } });
        byKey[key] = { name, grade, squad };
        added++;
      }
    }
    if (ops.length) await roster.bulkWrite(ops);
    res.json({ ok: true, added, updated });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

router.post('/roster/update', requireAuth, async (req, res) => {
  try {
    const grade = req.body.grade === '' || req.body.grade == null ? null : Number(req.body.grade);
    const squad = SQUADS.includes(req.body.squad) ? req.body.squad : null;
    await roster.updateOne({ _id: new ObjectId(String(req.body.id)) }, { $set: { grade, squad } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// rename is allowed ONLY while a player has no recorded games, so a stats
// history can never be reassigned to a different person by accident
router.post('/roster/rename', requireAuth, async (req, res) => {
  try {
    const id = new ObjectId(String(req.body.id));
    const doc = await roster.findOne({ _id: id });
    if (!doc) return res.status(404).json({ error: 'not on the roster' });

    const played = await games.countDocuments({ 'buzzes.player': doc.name });
    if (played) {
      return res.status(400).json({
        error: doc.name + ' already has games recorded, so the name is locked. Remove and re-add only if you are sure.'
      });
    }

    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name cannot be empty' });

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const clash = await roster.findOne({
      _id: { $ne: id },
      name: { $regex: '^' + escaped + '$', $options: 'i' }
    });
    if (clash) return res.status(400).json({ error: clash.name + ' is already on the roster' });

    await roster.updateOne({ _id: id }, { $set: { name } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

router.post('/roster/remove', requireAuth, async (req, res) => {
  try {
    await roster.deleteOne({ _id: new ObjectId(String(req.body.id)) });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// ---------- parsing MODAQ exports ----------

/**
 * Celerity, as qbreader defines it: the share of the question still unread when
 * the buzz came, so 1.0 is a first-word buzz and 0 is a buzz at the very end.
 * qbreader measures that in characters; a word index is proportional to it and
 * is what MODAQ gives us, so use the word position against the buzzable-word
 * count the reader sent. Returns null when the denominator is unknown, which is
 * the case for games exported from MODAQ somewhere else.
 * @param {?number} wordIndex
 * @param {?number} wordCount
 * @returns {?number}
 */
function celerityOf (wordIndex, wordCount) {
  if (wordIndex == null || !wordCount || wordCount < 2) { return null; }
  const c = 1 - wordIndex / (wordCount - 1);
  return Math.min(1, Math.max(0, Number(c.toFixed(4))));
}

function parseQbj (m, cats, denominators) {
  const teams = [];
  const heardByPlayer = {};
  for (const mt of m.match_teams || []) {
    const teamName = mt.team?.name || 'Unknown team';
    const roster = [];
    for (const mp of mt.match_players || []) {
      const name = mp.player?.name || 'Unknown player';
      roster.push(name);
      if (typeof mp.tossups_heard === 'number') heardByPlayer[teamName + '|' + name] = mp.tossups_heard;
    }
    teams.push({ name: teamName, players: roster, score: 0 });
  }
  const buzzes = [];
  for (const q of m.match_questions || []) {
    const num = q.question_number || q.tossup_question?.question_number;
    for (const b of q.buzzes || []) {
      buzzes.push({
        player: b.player?.name || 'Unknown player',
        team: b.team?.name || 'Unknown team',
        questionNumber: num,
        category: categoryFor(num, cats),
        value: b.result?.value ?? 0,
        wordIndex: b.buzz_position?.word_index ?? null,
        wordCount: denominators?.words?.[num - 1] ?? null,
        charCount: denominators?.chars?.[num - 1] ?? null
      });
    }
  }
  return { teams, buzzes, heardByPlayer, tossupsRead: m.tossups_read || (m.match_questions || []).length };
}

function parseRaw (o, cats, denominators) {
  const teams = {};
  for (const p of o.players || []) {
    const t = p.teamName || 'Unknown team';
    teams[t] = teams[t] || { name: t, players: [], score: 0 };
    teams[t].players.push(p.name);
  }
  const buzzes = [];
  (o.cycles || []).forEach((cycle, i) => {
    const num = i + 1;
    const add = (marker, fallback) => {
      if (!marker) return;
      const pl = marker.player || marker;
      buzzes.push({
        player: pl.name || 'Unknown player',
        team: pl.teamName || 'Unknown team',
        questionNumber: num,
        category: categoryFor(num, cats),
        value: typeof marker.points === 'number' ? marker.points : fallback,
        wordIndex: typeof marker.position === 'number' ? marker.position : null,
        wordCount: denominators?.words?.[num - 1] ?? null,
        charCount: denominators?.chars?.[num - 1] ?? null
      });
    };
    add(cycle.correctBuzz, 10);
    for (const w of cycle.wrongBuzzes || []) add(w, -5);
  });
  return { teams: Object.values(teams), buzzes, heardByPlayer: {}, tossupsRead: (o.cycles || []).length };
}

function normalize (raw, label, cats, denominators) {
  let parsed;
  if (raw && (raw.match_teams || raw.match_questions)) parsed = parseQbj(raw, cats, denominators);
  else if (raw && raw.cycles) parsed = parseRaw(raw, cats, denominators);
  else throw new Error('unrecognized export format - use MODAQ\'s QBJ or JSON export');

  const byTeam = {};
  for (const b of parsed.buzzes) byTeam[b.team] = (byTeam[b.team] || 0) + (b.value || 0);
  for (const t of parsed.teams) t.score = byTeam[t.name] || 0;
  for (const name of Object.keys(byTeam)) {
    if (!parsed.teams.find(t => t.name === name)) parsed.teams.push({ name, players: [], score: byTeam[name] });
  }
  if (!parsed.buzzes.length) throw new Error('no buzzes found in that file');

  return {
    label: label || 'Practice',
    playedAt: new Date(),
    tossupsRead: parsed.tossupsRead,
    categories: cats || null,
    // kept so celerity can be recalculated later without replaying anything
    wordCounts: denominators?.words ?? null,
    charCounts: denominators?.chars ?? null,
    teams: parsed.teams,
    heardByPlayer: parsed.heardByPlayer,
    buzzes: parsed.buzzes
  };
}

// ---------- endpoints ----------

router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { game, label, categories, wordCounts, charCounts } = req.body || {};
    if (!game) return res.status(400).json({ error: 'no game data' });
    const cats = Array.isArray(categories)
      ? categories.map(c => String(c == null ? '' : c).trim().slice(0, 60)).filter(Boolean)
      : null;
    const counts = arr => (Array.isArray(arr)
      ? arr.map(n => (Number.isFinite(Number(n)) && Number(n) > 0 ? Math.round(Number(n)) : null))
      : null);
    const denominators = { words: counts(wordCounts), chars: counts(charCounts) };
    const doc = normalize(game, label, cats && cats.length ? cats : null, denominators);

    // backstop against duplicate players: if a name already exists with different
    // capitalization or stray spaces, store it under the existing spelling
    const existing = (await games.distinct('buzzes.player')).filter(Boolean);
    const canon = {};
    for (const n of existing) canon[n.trim().toLowerCase()] = n;
    const fix = n => canon[String(n || '').trim().toLowerCase()] || String(n || '').trim();
    for (const b of doc.buzzes) b.player = fix(b.player);
    for (const t of doc.teams) t.players = (t.players || []).map(fix);

    const result = await games.insertOne(doc);
    res.json({ ok: true, id: result.insertedId, buzzes: doc.buzzes.length });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// Lineups from recent games. Tryouts run the same people repeatedly with one
// side swapping out, so the reader offers these instead of retyping a roster.
router.get('/lineups', requireAuth, async (req, res) => {
  const recent = await games
    .find({}, { projection: { label: 1, playedAt: 1, 'teams.name': 1, 'teams.players': 1 } })
    .sort({ playedAt: -1 })
    .limit(25)
    .toArray();
  res.json({
    games: recent
      .map(g => ({
        id: String(g._id),
        label: g.label,
        playedAt: g.playedAt,
        teams: (g.teams || [])
          .map(t => ({ name: t.name, players: (t.players || []).filter(Boolean) }))
          .filter(t => t.players.length)
      }))
      .filter(g => g.teams.length)
  });
});

// full record of one game, for download/backup
router.get('/game/:id', requireAuth, async (req, res) => {
  try {
    const g = await games.findOne({ _id: new ObjectId(String(req.params.id)) });
    if (!g) return res.status(404).json({ error: 'game not found' });
    res.json(g);
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

router.post('/delete', requireAuth, async (req, res) => {
  try {
    await games.deleteOne({ _id: new ObjectId(String(req.body.id)) });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

router.get('/data', requireAuth, async (req, res) => {
  const all = await games.find({}).sort({ playedAt: 1 }).toArray();
  const players = {};

  // squad assignment comes from the roster, not from whatever the moderator
  // typed as a team name in a given game
  const squadByName = {};
  for (const r of await roster.find({}).toArray()) {
    squadByName[r.name.trim().toLowerCase()] = r.squad || null;
  }

  for (const g of all) {
    const gid = String(g._id);
    const gLabel = g.label + ' (' + new Date(g.playedAt).toLocaleDateString() + ')';

    // how many tossups each player was actually in the room for. MODAQ reports
    // it per player in its QBJ export, keyed "team|player"; without it fall back
    // to the whole round, which is what a full game of play amounts to.
    const heardThisGame = {};
    for (const key of Object.keys(g.heardByPlayer || {})) {
      const name = key.slice(key.indexOf('|') + 1);
      heardThisGame[name] = Math.max(heardThisGame[name] ?? 0, g.heardByPlayer[key]);
    }

    for (const b of g.buzzes) {
      const p = players[b.player] || (players[b.player] = {
        name: b.player,
        games: new Set(),
        correct: 0,
        neg: 0,
        points: 0,
        celerities: [],
        heard: 0,
        byCategory: {},
        perGame: {}
      });
      if (!p.games.has(gid)) {
        p.games.add(gid);
        p.heard += heardThisGame[b.player] ?? g.tossupsRead ?? 0;
      }
      const pg = p.perGame[gid] || (p.perGame[gid] = { id: gid, label: gLabel, points: 0, correct: 0, neg: 0 });
      const pc = p.byCategory[b.category] || (p.byCategory[b.category] = { correct: 0, neg: 0 });
      if (b.value > 0) {
        p.correct++; pc.correct++; pg.correct++;
        // celerity is only meaningful on a correct buzz, same as qbreader
        const c = celerityOf(b.wordIndex, b.wordCount);
        if (c != null) { p.celerities.push(c); }
      } else if (b.value < 0) { p.neg++; pc.neg++; pg.neg++; }
      p.points += b.value || 0;
      pg.points += b.value || 0;
    }
  }

  const playerRows = Object.values(players).map(p => {
    const buzzes = p.correct + p.neg;
    const avgCelerity = p.celerities.length
      ? +(p.celerities.reduce((a, b) => a + b, 0) / p.celerities.length).toFixed(3)
      : null;
    const squad = squadByName[p.name.trim().toLowerCase()];
    return {
      name: p.name,
      team: squad || 'Unassigned',
      games: p.games.size,
      correct: p.correct,
      negs: p.neg,
      points: p.points,
      ppg: p.games.size ? +(p.points / p.games.size).toFixed(1) : 0,
      accuracy: buzzes ? Math.round((p.correct / buzzes) * 100) : null,
      celerity: avgCelerity,
      celeritySum: p.celerities.reduce((a, b) => a + b, 0),
      celerityCount: p.celerities.length,
      heard: p.heard,
      // points per tossup heard -- a fairer rate than points per game when
      // players rotate in and out mid-round
      ppth: p.heard ? +(p.points / p.heard).toFixed(2) : null,
      byCategory: p.byCategory,
      perGame: Object.values(p.perGame)
    };
  }).sort((a, b) => b.points - a.points);

  res.json({
    games: all.map(g => ({
      id: String(g._id),
      label: g.label,
      playedAt: g.playedAt,
      tossupsRead: g.tossupsRead,
      teams: g.teams.map(t => ({ name: t.name, score: t.score }))
    })),
    players: playerRows,
    categoryNames: CATEGORIES
  });
});

// ---------- page ----------

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Practice stats</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" defer></script>
<style>
 /* one type scale and one set of surfaces for the whole page */
 body{background:#f6f7f9;color:#1f2733;font-size:15px}
 h1{font-size:1.35rem;font-weight:600}
 h2{font-size:1.05rem;font-weight:600;color:#33415c;margin:2.25rem 0 .65rem}
 h3{font-size:.95rem;font-weight:600;color:#33415c;margin:0 0 .5rem}
 .subhead{font-size:.85rem;font-weight:600;color:#6b7280;text-transform:uppercase;
   letter-spacing:.03em;margin:1.25rem 0 .5rem}
 .card{border:1px solid #e4e8ee;border-radius:.5rem;box-shadow:none}
 .note{font-size:.83rem;color:#6b7280;margin:.5rem 0 0}
 table{font-size:.9rem;margin-bottom:0}
 thead th{font-weight:600;color:#4b5563;border-bottom:1px solid #e4e8ee;white-space:nowrap}
 th,td{padding:.5rem .65rem !important;vertical-align:middle}
 .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
 .heat{display:inline-block;min-width:3rem;padding:.15rem .4rem;border-radius:.25rem;
   text-align:center;font-size:.85rem}
 .kshsaa-bar{background:#eef1f7;border-bottom:1px solid #d9e0ec}
 .kshsaa-bar a{color:#4a5b7d;text-decoration:none;margin:0 .85rem;font-size:.9rem}
 .kshsaa-bar a:hover{color:#1f3864;text-decoration:underline}
 .kshsaa-bar a.active{color:#1f3864;font-weight:600}
 /* three columns so the section links stay centred on the page no matter how
    wide the "back to QBReader" link on the left happens to be */
 .kshsaa-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.25rem}
 .kshsaa-nav .kshsaa-links{grid-column:2;display:flex;flex-wrap:wrap;justify-content:center;gap:.35rem 0}
 .kshsaa-home{justify-self:start;margin-left:0 !important;white-space:nowrap}
 @media (max-width:900px){
   .kshsaa-nav{grid-template-columns:1fr;justify-items:center;gap:.35rem}
   .kshsaa-nav .kshsaa-links{grid-column:1}
 }
 .rowlink{cursor:pointer}
 tr.selected td{background:#eef4ff !important}
 .res{display:inline-block;padding:.12rem .5rem;border-radius:.3rem;font-size:.85rem;margin-right:.35rem}
 .res-win{background:#e6f2ea;color:#1d6b40;font-weight:600}
 .res-loss{background:#f2f3f5;color:#6b7280}
 .res-tie{background:#fbf1de;color:#8a6116}
 .res .sc{font-variant-numeric:tabular-nums}
 .form-label{font-size:.85rem;font-weight:600;color:#4b5563}
</style>
</head><body>

<div class="kshsaa-bar py-2 mb-3">
  <div class="container kshsaa-nav" style="max-width:1100px">
    <a class="kshsaa-home" href="/">&larr; QBReader</a>
    <span class="kshsaa-links">
      <a href="/kshsaa-play">Read a round</a>
      <a href="/kshsaa-round">Download packet</a>
      <a href="/kshsaa-stats" class="active">Practice stats</a>
      <a href="/kshsaa-questions">Question bank</a>
      <a href="/kshsaa-spanish/">Spanish Practice</a>
    </span>
  </div>
</div>

<div class="container pb-5" style="max-width:1100px">
  <div class="d-flex justify-content-between align-items-center">
    <h1 class="h4 mb-0">Practice stats</h1>
    <button class="btn btn-sm btn-outline-secondary d-none" id="logout">Log out</button>
  </div>

  <div id="login" class="card mt-3 d-none" style="max-width:420px"><div class="card-body">
    <label class="form-label">Team password</label>
    <input type="password" class="form-control mb-2" id="pw">
    <button class="btn btn-primary" id="loginBtn">Enter</button>
    <div class="small text-danger mt-2" id="loginErr"></div>
  </div></div>

  <div id="app" class="d-none">
    <ul class="nav nav-tabs mt-3" id="tabs">
      <li class="nav-item"><button class="nav-link active" data-tab="stats" type="button">Stats</button></li>
      <li class="nav-item"><button class="nav-link" data-tab="roster" type="button">Roster</button></li>
    </ul>

    <div id="tabStats">
    <div class="card mt-3"><div class="card-body">
      <h2 class="mt-0">Add a practice game</h2>
      <p class="small text-secondary">Games read on this site save themselves &mdash; use
      &ldquo;Save to team stats&rdquo; in the reader. This form is for games exported from MODAQ elsewhere.</p>
      <div class="row g-2 align-items-end">
        <div class="col-sm-5"><label class="form-label small">Label</label>
          <input class="form-control form-control-sm" id="label" placeholder="Tuesday practice, game 2"></div>
        <div class="col-sm-5"><label class="form-label small">MODAQ export file</label>
          <input class="form-control form-control-sm" type="file" id="file" accept=".json,.qbj"></div>
        <div class="col-sm-2"><button class="btn btn-primary btn-sm w-100" id="up">Upload</button></div>
      </div>
      <div class="small mt-2" id="upMsg"></div>
    </div></div>
    <div id="content"></div>
    </div>

    <div id="tabRoster" class="d-none">
    <div class="card mt-3"><div class="card-body">
      <h2 class="mt-0">Roster</h2>
      <p class="note mb-2" style="margin-top:0">Names here autocomplete when setting up a round, even before
      anyone has played, and the squad you assign is what shows in the stats table. One player per line;
      grade and squad after commas are optional (<code>Max Chen, 11, JV 2</code>). Re-pasting the list is
      safe &mdash; existing names are left alone.</p>
      <div class="row g-2 align-items-start">
        <div class="col-sm-8"><textarea class="form-control form-control-sm" id="rosterText" rows="4"
          placeholder="Max Chen, 11&#10;Sarah Kim, 12&#10;Diego Alvarez, 9"></textarea></div>
        <div class="col-sm-4"><button class="btn btn-primary btn-sm w-100" id="rosterAdd">Add to roster</button>
          <div class="small mt-2" id="rosterMsg"></div></div>
      </div>
      <div id="rosterList" class="mt-3"></div>
    </div></div>
    </div>
  </div>
</div>

<script>
var $ = function (id) { return document.getElementById(id); };
var DATA = null, SELECTED = null, CHARTS = {}, SQUADS = [], SQUAD = '';

function show (a) {
  $('login').classList.toggle('d-none', a);
  $('app').classList.toggle('d-none', !a);
  $('logout').classList.toggle('d-none', !a);
  if (a) load();
}
fetch('/kshsaa-stats/me').then(function (r) { return r.json(); }).then(function (d) { show(d.authed); });

$('loginBtn').onclick = function () {
  fetch('/kshsaa-stats/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: $('pw').value })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) { res.ok ? show(true) : ($('loginErr').textContent = res.d.error || 'failed'); });
};
$('pw').onkeydown = function (e) { if (e.key === 'Enter') $('loginBtn').click(); };
$('logout').onclick = function () { fetch('/kshsaa-stats/logout', { method: 'POST' }).then(function () { show(false); }); };

$('up').onclick = function () {
  var f = $('file').files[0];
  if (!f) { $('upMsg').textContent = 'pick a file first'; return; }
  var reader = new FileReader();
  reader.onload = function () {
    var game;
    try { game = JSON.parse(reader.result); }
    catch (e) { $('upMsg').innerHTML = '<span class="text-danger">not valid JSON</span>'; return; }
    fetch('/kshsaa-stats/upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: game, label: $('label').value })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) {
          $('upMsg').innerHTML = '<span class="text-success">added (' + res.d.buzzes + ' buzzes)</span>';
          $('file').value = ''; $('label').value = ''; load();
        } else {
          $('upMsg').innerHTML = '<span class="text-danger">' + (res.d.error || 'upload failed') + '</span>';
        }
      });
  };
  reader.readAsText(f);
};

function load () {
  fetch('/kshsaa-stats/data').then(function (r) { return r.json(); }).then(function (d) { DATA = d; render(d); });
  loadRoster();
}

function loadRoster () {
  fetch('/kshsaa-stats/roster').then(function (r) { return r.json(); }).then(function (d) {
    var list = d.roster || [];
    if (!list.length) {
      $('rosterList').innerHTML = '<p class="note">No one on the roster yet.</p>';
      return;
    }
    SQUADS = d.squads || [];
    var h = '<div class="table-responsive"><table class="table table-sm align-middle mb-0"><thead><tr>' +
      '<th>Player</th><th style="width:7rem">Grade</th><th style="width:11rem">Squad</th>' +
      '<th>Status</th><th style="width:9rem"></th></tr></thead><tbody>';
    list.forEach(function (r) {
      h += '<tr data-row="' + r.id + '"><td class="ncell">' + esc(r.name) + '</td>' +
        '<td class="gcell">' + (r.grade ? r.grade + 'th' : '<span class="text-secondary">-</span>') + '</td>' +
        '<td class="scell">' + (r.squad ? esc(r.squad) : '<span class="text-secondary">unassigned</span>') + '</td>' +
        '<td class="text-secondary">' + (r.hasPlayed ? 'has stats' : 'no games yet') + '</td>' +
        '<td class="text-end acell">' +
        '<button class="btn btn-sm btn-link p-0 me-2 redit" data-id="' + r.id +
        '" data-name="' + esc(r.name) + '" data-played="' + (r.hasPlayed ? '1' : '') +
        '" data-squad="' + esc(r.squad || '') + '"' +
        ' data-grade="' + (r.grade || '') + '">edit</button>' +
        '<button class="btn btn-sm btn-link text-danger p-0 rdel" data-id="' + r.id + '">remove</button>' +
        '</td></tr>';
    });
    $('rosterList').innerHTML = h + '</tbody></table></div>';

    Array.prototype.forEach.call(document.querySelectorAll('.redit'), function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-id');
        var played = btn.getAttribute('data-played') === '1';
        var oldName = btn.getAttribute('data-name');
        var row = document.querySelector('[data-row="' + id + '"]');
        var ncell = row.querySelector('.ncell');
        var gcell = row.querySelector('.gcell');
        var acell = row.querySelector('.acell');

        // name is editable only until the player has games recorded
        if (played) {
          ncell.innerHTML = esc(oldName) +
            ' <span class="text-secondary" title="Name is locked because this player has recorded stats">' +
            '(locked)</span>';
        } else {
          ncell.innerHTML = '<input class="form-control form-control-sm nedit" value="' + esc(oldName) + '">';
        }
        gcell.innerHTML = '<input class="form-control form-control-sm gedit" type="number" min="9" max="12" ' +
          'style="width:5rem" value="' + (btn.getAttribute('data-grade') || '') + '">';
        var curSquad = btn.getAttribute('data-squad') || '';
        row.querySelector('.scell').innerHTML = '<select class="form-select form-select-sm sedit">' +
          '<option value="">unassigned</option>' +
          SQUADS.map(function (s) {
            return '<option value="' + esc(s) + '"' + (s === curSquad ? ' selected' : '') + '>' + esc(s) + '</option>';
          }).join('') + '</select>';
        acell.innerHTML = '<button class="btn btn-sm btn-primary py-0 px-2 me-1 gsave">save</button>' +
          '<button class="btn btn-sm btn-link p-0 gcancel">cancel</button>';
        (ncell.querySelector('.nedit') || gcell.querySelector('.gedit')).focus();

        acell.querySelector('.gsave').onclick = function () {
          var newName = ncell.querySelector('.nedit') ? ncell.querySelector('.nedit').value.trim() : oldName;
          var saveGrade = function () {
            fetch('/kshsaa-stats/roster/update', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: id,
                grade: gcell.querySelector('.gedit').value,
                squad: row.querySelector('.sedit').value
              })
            }).then(loadRoster);
          };
          if (newName && newName !== oldName) {
            fetch('/kshsaa-stats/roster/rename', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id, name: newName })
            }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
              .then(function (res) {
                if (!res.ok) { alert(res.d.error || 'could not rename'); loadRoster(); return; }
                saveGrade();
              });
          } else saveGrade();
        };
        acell.querySelector('.gcancel').onclick = loadRoster;
        gcell.querySelector('.gedit').onkeydown = function (e) {
          if (e.key === 'Enter') acell.querySelector('.gsave').click();
          if (e.key === 'Escape') loadRoster();
        };
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll('.rdel'), function (btn) {
      btn.onclick = function () {
        if (!confirm('Remove from the roster? Their past stats are kept.')) return;
        fetch('/kshsaa-stats/roster/remove', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: btn.getAttribute('data-id') })
        }).then(loadRoster);
      };
    });
  });
}

Array.prototype.forEach.call(document.querySelectorAll('#tabs [data-tab]'), function (btn) {
  btn.onclick = function () {
    var tab = btn.getAttribute('data-tab');
    Array.prototype.forEach.call(document.querySelectorAll('#tabs .nav-link'), function (b) {
      b.classList.toggle('active', b === btn);
    });
    $('tabStats').classList.toggle('d-none', tab !== 'stats');
    $('tabRoster').classList.toggle('d-none', tab !== 'roster');
  };
});

document.getElementById('rosterAdd').onclick = function () {
  var text = $('rosterText').value;
  if (!text.trim()) { $('rosterMsg').textContent = 'paste some names first'; return; }
  fetch('/kshsaa-stats/roster/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) { $('rosterMsg').innerHTML = '<span class="text-danger">' + d.error + '</span>'; return; }
    $('rosterMsg').innerHTML = '<span class="text-success">added ' + d.added +
      (d.updated ? ', updated ' + d.updated : '') + '</span>';
    $('rosterText').value = '';
    loadRoster();
  });
};
function esc (s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
function heatColor (pct) {
  if (pct == null) return '#f1f1f1';
  var g = Math.round(200 * (pct / 100));
  return 'rgba(' + (220 - g) + ',' + (120 + g / 2) + ',120,0.45)';
}
function pctOf (v) { var t = v.correct + v.neg; return t ? Math.round((v.correct / t) * 100) : null; }
function playerByName (n) {
  for (var i = 0; i < DATA.players.length; i++) if (DATA.players[i].name === n) return DATA.players[i];
  return null;
}

function render (d) {
  if (!d.games.length) {
    $('content').innerHTML = '<div class="card mt-3"><div class="card-body text-center py-5">' +
      '<p class="mb-1 fw-semibold">No practices recorded yet</p>' +
      '<p class="text-secondary small mb-3">Read a round on this site and click &ldquo;Save to team stats&rdquo; ' +
      'when the game ends &mdash; the numbers show up here.</p>' +
      '<a class="btn btn-primary btn-sm" href="/kshsaa-play">Read a round</a></div></div>';
    return;
  }

  var h = '';

  // ---- players ----
  var squadsPresent = [];
  d.players.forEach(function (p) {
    if (squadsPresent.indexOf(p.team) === -1) squadsPresent.push(p.team);
  });
  squadsPresent.sort();

  h += '<h2>Players</h2>' +
    '<div class="mb-2" id="squadChips">' +
    '<button class="btn btn-sm btn-outline-secondary me-1 mb-1 chip active" data-squad="">All squads</button>' +
    squadsPresent.map(function (s) {
      return '<button class="btn btn-sm btn-outline-secondary me-1 mb-1 chip" data-squad="' + esc(s) + '">' +
        esc(s) + '</button>';
    }).join('') + '</div>' +
    '<div id="squadSummary"></div>' +
    '<input class="form-control form-control-sm mb-2" id="search" placeholder="Search players...">' +
    '<div class="card"><div class="card-body p-0"><div class="table-responsive">' +
    '<table class="table table-sm table-hover align-middle"><thead><tr>' +
    '<th>Player</th><th>Team</th><th class="num">Games</th><th class="num">Correct</th>' +
    '<th class="num">Negs</th><th class="num">Points</th>' +
    '<th class="num">Buzz accuracy</th><th class="num">Celerity</th>' +
    '<th class="num">Questions seen</th><th class="num">Points/question</th>' +
    '</tr></thead><tbody id="ptbody">';
  d.players.forEach(function (p) {
    h += '<tr class="rowlink prow" data-name="' + esc(p.name) + '" data-squad="' + esc(p.team) + '">' +
      '<td>' + esc(p.name) + '</td>' +
      '<td class="text-secondary">' + esc(p.team) + '</td>' +
      '<td class="num">' + p.games + '</td><td class="num">' + p.correct + '</td>' +
      '<td class="num text-danger">' + p.negs + '</td>' +
      '<td class="num fw-semibold">' + p.points + '</td>' +
      '<td class="num">' + (p.accuracy == null ? '-' : p.accuracy + '%') + '</td>' +
      '<td class="num">' + (p.celerity == null ? '-' : p.celerity.toFixed(3)) + '</td>' +
      '<td class="num">' + (p.heard || '-') + '</td>' +
      '<td class="num">' + (p.ppth == null ? '-' : p.ppth) + '</td></tr>';
  });
  h += '</tbody></table></div></div></div>' +
    '<div id="spotlight"></div>';

  // category heat grid - same section, its own table so neither gets squished
  h += '<div class="subhead">Category breakdown</div>' +
    '<div class="card"><div class="card-body p-0"><div class="table-responsive">' +
    '<table class="table table-sm align-middle"><thead><tr><th>Player</th>';
  d.categoryNames.forEach(function (c) { h += '<th class="text-center">' + esc(c) + '</th>'; });
  h += '</tr></thead><tbody>';
  d.players.forEach(function (p) {
    h += '<tr class="prow rowlink" data-name="' + esc(p.name) + '"><td>' + esc(p.name) + '</td>';
    d.categoryNames.forEach(function (c) {
      var v = p.byCategory[c] || { correct: 0, neg: 0 };
      h += '<td class="text-center"><span class="heat" style="background:' + heatColor(pctOf(v)) + '">' +
        v.correct + (v.neg ? ' / -' + v.neg : '') + '</span></td>';
    });
    h += '</tr>';
  });
  h += '</tbody></table></div></div></div>';

  // ---- compare ----
  var opts = d.players.map(function (p) { return '<option>' + esc(p.name) + '</option>'; }).join('');
  h += '<h2>Compare two players</h2><div class="card"><div class="card-body">' +
    '<div class="row g-2 mb-3"><div class="col-sm-5"><select class="form-select form-select-sm" id="cmpA">' + opts + '</select></div>' +
    '<div class="col-sm-2 text-center small text-secondary pt-1">vs</div>' +
    '<div class="col-sm-5"><select class="form-select form-select-sm" id="cmpB">' + opts + '</select></div></div>' +
    '<div id="cmpOut"></div></div></div>';

  // ---- games ----
  h += '<h2>Games</h2><div class="card"><div class="card-body p-0"><div class="table-responsive">' +
    '<table class="table table-sm mb-0"><thead><tr><th>Date</th><th>Label</th><th>Result</th>' +
    '<th class="num">Tossups</th><th></th></tr></thead><tbody>';
  d.games.slice().reverse().forEach(function (g) {
    var best = Math.max.apply(null, g.teams.map(function (t) { return t.score; }));
    var tied = g.teams.filter(function (t) { return t.score === best; }).length > 1;
    var score = g.teams.map(function (t) {
      var cls = tied && t.score === best ? 'res-tie' : (t.score === best ? 'res-win' : 'res-loss');
      return '<span class="res ' + cls + '">' + esc(t.name) + ': <span class="sc">' + t.score + '</span></span>';
    }).join('');
    h += '<tr><td class="text-secondary">' + new Date(g.playedAt).toLocaleDateString() + '</td>' +
      '<td>' + esc(g.label) + '</td><td>' + score + '</td>' +
      '<td class="num">' + g.tossupsRead + '</td>' +
      '<td class="text-end text-nowrap">' +
      '<div class="dropdown d-inline-block">' +
      '<button class="btn btn-sm btn-outline-secondary dropdown-toggle py-0 px-2" type="button" ' +
      'data-bs-toggle="dropdown" aria-expanded="false">Export</button>' +
      '<ul class="dropdown-menu dropdown-menu-end">' +
      '<li><button class="dropdown-item gjson" data-id="' + g.id + '">Download JSON</button></li>' +
      '<li><button class="dropdown-item gcsv" data-id="' + g.id + '">Download CSV</button></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button class="dropdown-item text-danger del" data-id="' + g.id + '">Remove game</button></li>' +
      '</ul></div>' +
      '</td></tr>';
  });
  h += '</tbody></table></div></div></div>';

  $('content').innerHTML = h;

  $('search').oninput = applyFilters;
  Array.prototype.forEach.call(document.querySelectorAll('#squadChips .chip'), function (chip) {
    chip.onclick = function () {
      SQUAD = chip.getAttribute('data-squad');
      Array.prototype.forEach.call(document.querySelectorAll('#squadChips .chip'), function (c) {
        c.classList.toggle('active', c === chip);
      });
      applyFilters();
      renderSquadSummary();
    };
  });
  applyFilters();
  renderSquadSummary();
  Array.prototype.forEach.call(document.querySelectorAll('.prow'), function (row) {
    row.onclick = function () { selectPlayer(row.getAttribute('data-name')); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('.gjson'), function (btn) {
    btn.onclick = function () { downloadGame(btn.getAttribute('data-id'), 'json'); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('.gcsv'), function (btn) {
    btn.onclick = function () { downloadGame(btn.getAttribute('data-id'), 'csv'); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('.del'), function (btn) {
    btn.onclick = function () {
      if (!confirm('Remove this game from the stats?')) return;
      fetch('/kshsaa-stats/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: btn.getAttribute('data-id') })
      }).then(load);
    };
  });
  if (d.players.length > 1) $('cmpB').selectedIndex = 1;
  $('cmpA').onchange = $('cmpB').onchange = compare;
  compare();
  if (SELECTED && playerByName(SELECTED)) selectPlayer(SELECTED);
}

function saveBlob (text, type, filename) {
  var blob = new Blob([text], { type: type });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function downloadGame (id, format) {
  fetch('/kshsaa-stats/game/' + id).then(function (r) { return r.json(); }).then(function (g) {
    if (g.error) { alert(g.error); return; }
    var base = (g.label || 'game').replace(/[^A-Za-z0-9 _-]/g, '') + ' ' +
      new Date(g.playedAt).toISOString().slice(0, 10);
    if (format === 'json') {
      saveBlob(JSON.stringify(g, null, 2), 'application/json', base + '.json');
      return;
    }
    var q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
    var rows = [['question', 'category', 'player', 'team', 'points', 'buzz_word_index'].join(',')];
    (g.buzzes || []).forEach(function (b) {
      rows.push([b.questionNumber, q(b.category), q(b.player), q(b.team), b.value,
        b.wordIndex == null ? '' : b.wordIndex].join(','));
    });
    rows.push('');
    rows.push(['team', 'final_score'].join(','));
    (g.teams || []).forEach(function (t) { rows.push([q(t.name), t.score].join(',')); });
    saveBlob(rows.join('\\r\\n'), 'text/csv', base + '.csv');
  });
}

function applyFilters () {
  var q = ($('search') && $('search').value || '').toLowerCase();
  Array.prototype.forEach.call(document.querySelectorAll('.prow'), function (row) {
    var name = row.getAttribute('data-name').toLowerCase();
    var squad = row.getAttribute('data-squad') || '';
    var hide = (q && name.indexOf(q) === -1) || (SQUAD && squad !== SQUAD);
    row.style.display = hide ? 'none' : '';
  });
}

function renderSquadSummary () {
  var box = $('squadSummary');
  if (!box) return;
  if (!SQUAD) { box.innerHTML = ''; return; }

  var members = DATA.players.filter(function (p) { return p.team === SQUAD; });
  if (!members.length) { box.innerHTML = ''; return; }

  var totals = { correct: 0, negs: 0, points: 0, celSum: 0, celCount: 0, heard: 0, byCategory: {} };
  var gameIds = {};
  members.forEach(function (p) {
    totals.correct += p.correct;
    totals.negs += p.negs;
    totals.points += p.points;
    totals.celSum += p.celeritySum || 0;
    totals.celCount += p.celerityCount || 0;
    totals.heard += p.heard || 0;
    p.perGame.forEach(function (g) { gameIds[g.id] = true; });
    DATA.categoryNames.forEach(function (c) {
      var v = p.byCategory[c] || { correct: 0, neg: 0 };
      var t = totals.byCategory[c] || (totals.byCategory[c] = { correct: 0, neg: 0 });
      t.correct += v.correct; t.neg += v.neg;
    });
  });

  var gameCount = Object.keys(gameIds).length;
  var buzzes = totals.correct + totals.negs;
  var stat = function (label, value) {
    return '<div class="col-6 col-md-3 col-lg-2 mb-2"><div class="note" style="margin:0">' + label + '</div>' +
      '<div style="font-size:1.1rem;font-weight:600">' + value + '</div></div>';
  };

  var h = '<div class="card mb-3"><div class="card-body">' +
    '<h3>' + esc(SQUAD) + ' &mdash; combined</h3><div class="row">' +
    stat('Players', members.length) +
    stat('Games', gameCount) +
    stat('Points', totals.points) +

    stat('Correct', totals.correct) +
    stat('Negs', totals.negs) +
    stat('Buzz accuracy', buzzes ? Math.round((totals.correct / buzzes) * 100) + '%' : '-') +
    stat('Celerity', totals.celCount ? (totals.celSum / totals.celCount).toFixed(3) : '-') +
    stat('Questions seen', totals.heard || '-') +
    '</div><div class="table-responsive mt-2"><table class="table table-sm mb-0"><thead><tr>';
  DATA.categoryNames.forEach(function (c) { h += '<th class="text-center">' + esc(c) + '</th>'; });
  h += '</tr></thead><tbody><tr>';
  DATA.categoryNames.forEach(function (c) {
    var v = totals.byCategory[c] || { correct: 0, neg: 0 };
    h += '<td class="text-center"><span class="heat" style="background:' + heatColor(pctOf(v)) + '">' +
      v.correct + (v.neg ? ' / -' + v.neg : '') + '</span></td>';
  });
  h += '</tr></tbody></table></div>' +
    '<p class="note">Squad totals across every game any member played.</p></div></div>';
  box.innerHTML = h;
}

function selectPlayer (name) {
  SELECTED = name;
  var p = playerByName(name);
  if (!p) return;
  Array.prototype.forEach.call(document.querySelectorAll('.prow'), function (row) {
    row.classList.toggle('selected', row.getAttribute('data-name') === name);
  });
  $('spotlight').innerHTML =
    '<div class="card mb-2"><div class="card-body">' +
    '<div class="d-flex justify-content-between align-items-center mb-2">' +
    '<h3 class="h6 mb-0">' + esc(p.name) + '</h3>' +
    '<span class="small text-secondary">' + p.games + ' games &middot; ' + p.points + ' points &middot; ' +
    (p.accuracy == null ? '-' : p.accuracy + '% accuracy') + '</span></div>' +
    '<div class="row g-3"><div class="col-md-7"><canvas id="chartCat" height="150"></canvas></div>' +
    '<div class="col-md-5"><canvas id="chartGames" height="150"></canvas></div></div></div></div>';

  Object.keys(CHARTS).forEach(function (k) { if (CHARTS[k]) CHARTS[k].destroy(); });
  if (typeof Chart === 'undefined') return;

  CHARTS.cat = new Chart($('chartCat'), {
    type: 'bar',
    data: {
      labels: DATA.categoryNames,
      datasets: [
        { label: 'Correct', data: DATA.categoryNames.map(function (c) { return (p.byCategory[c] || {}).correct || 0; }), backgroundColor: 'rgba(45,140,90,0.65)' },
        { label: 'Negs', data: DATA.categoryNames.map(function (c) { return (p.byCategory[c] || {}).neg || 0; }), backgroundColor: 'rgba(200,70,70,0.65)' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Buzzes by category' }, legend: { position: 'bottom' } },
      scales: { x: { ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });

  CHARTS.games = new Chart($('chartGames'), {
    type: 'line',
    data: {
      labels: p.perGame.map(function (g, i) { return 'G' + (i + 1); }),
      datasets: [{ label: 'Points', data: p.perGame.map(function (g) { return g.points; }),
        borderColor: '#1f3864', backgroundColor: 'rgba(31,56,100,0.15)', fill: true, tension: 0.25 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Points per game' }, legend: { display: false },
        tooltip: { callbacks: { title: function (items) { return p.perGame[items[0].dataIndex].label; } } }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function compare () {
  var a = playerByName($('cmpA').value), b = playerByName($('cmpB').value);
  if (!a || !b) return;
  var rows = [
    ['Games', a.games, b.games],
    ['Correct buzzes', a.correct, b.correct],
    ['Negs', a.negs, b.negs],
    ['Points', a.points, b.points],

    ['Buzz accuracy', a.accuracy == null ? '-' : a.accuracy + '%', b.accuracy == null ? '-' : b.accuracy + '%'],
    ['Celerity', a.celerity == null ? '-' : a.celerity.toFixed(3), b.celerity == null ? '-' : b.celerity.toFixed(3)],
    ['Questions seen', a.heard || '-', b.heard || '-'],
    ['Points per question', a.ppth == null ? '-' : a.ppth, b.ppth == null ? '-' : b.ppth]
  ];
  DATA.categoryNames.forEach(function (c) {
    var va = a.byCategory[c] || { correct: 0, neg: 0 }, vb = b.byCategory[c] || { correct: 0, neg: 0 };
    rows.push([c, va.correct + (va.neg ? ' / -' + va.neg : ''), vb.correct + (vb.neg ? ' / -' + vb.neg : '')]);
  });
  var h = '<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th></th>' +
    '<th class="num">' + esc(a.name) + '</th><th class="num">' + esc(b.name) + '</th></tr></thead><tbody>';
  rows.forEach(function (r, i) {
    h += '<tr' + (i < 9 ? '' : ' class="small"') + '><td>' + esc(r[0]) + '</td>' +
      '<td class="num">' + r[1] + '</td><td class="num">' + r[2] + '</td></tr>';
  });
  $('cmpOut').innerHTML = h + '</tbody></table></div>';
}
</script>
</body></html>`;

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(PAGE);
});

export default router;
