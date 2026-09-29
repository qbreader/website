// One-click KSHSAA round reader: generates a fresh round and opens it inside
// MODAQ with KSHSAA scoring preloaded, then saves the game to team stats.
//
// INSTALL
//   1. Save as   routes/kshsaa-play.js
//   2. In app.js:
//        import kshsaaPlayRouter from './routes/kshsaa-play.js';
//        app.use('/kshsaa-play', kshsaaPlayRouter);     // above app.use(indexRouter)
//
// Requires routes/kshsaa-round.js (questions) and routes/kshsaa-stats.js (saving
// and player-name autocomplete).

import { Router } from 'express';

const router = Router();

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Read a round</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
 #modaq{margin-top:1rem}.setup{max-width:820px;margin:0 auto}
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
 /* The clock rides inside MODAQ's own "Previous / Question # / Next" row so the
    moderator's pointer never leaves that cluster. React rebuilds that row on
    every question change, so the bar is inserted into it and re-inserted when
    dropped, rather than positioned against coordinates that go stale.

    It is taken out of flow with left:100%, which resolves against the nav row's
    own width. That leaves the row measuring exactly what MODAQ put in it, so
    the parent still centres Previous / Question # / Next on the page and the
    clock hangs off its right edge - no widths measured in JS, and nothing to
    recompute when the row moves.
    Controls match MODAQ's Fluent UI: 32px tall, 2px corners, #8a8886 border. */
 /* top:0, not top:50% - the row box is a few px taller than its buttons
    (inline descender space below them), so centring on the box sits low;
    the buttons and this bar are both 32px flush to the row's top edge */
 #timerBar{position:absolute;left:100%;top:0;margin-left:10px;
   display:inline-flex;align-items:center;flex-wrap:nowrap;gap:.3rem;
   user-select:none;font-family:'Segoe UI',system-ui,sans-serif}
 .tb-clock{font-size:1.35rem;font-weight:600;font-variant-numeric:tabular-nums;color:#201f1e;
   min-width:3.1rem;text-align:right;line-height:32px}
 .tb-clock.low{color:#a4500f}
 .tb-clock.done{color:#a4262c}
 .tb-clock.flash{animation:tpflash .45s ease-in-out 3}
 @keyframes tpflash{0%,100%{opacity:1}50%{opacity:.25}}
 .tb-btn{box-sizing:border-box;height:32px;border:1px solid #8a8886;
   background:#fff;color:#323130;border-radius:2px;font-size:14px;font-weight:600;
   font-family:inherit;padding:0 10px;display:inline-flex;align-items:center;
   justify-content:center;-webkit-font-smoothing:antialiased;white-space:nowrap}
 .tb-btn:hover{background:#f3f2f1}
 .tb-btn:active{background:#edebe9}
 .tb-btn-primary{background:#0078d4;border-color:#0078d4;color:#fff;min-width:66px}
 .tb-btn-primary:hover{background:#106ebe;border-color:#106ebe;color:#fff}
 .tb-durations{display:inline-flex;gap:4px}
 .tb-durations button{box-sizing:border-box;height:32px;border:1px solid #8a8886;
   background:#fff;color:#323130;border-radius:2px;font-size:14px;font-weight:600;
   font-family:inherit;padding:0 8px;min-width:42px;display:inline-flex;align-items:center;
   justify-content:center;-webkit-font-smoothing:antialiased}
 .tb-durations button:hover{background:#f3f2f1}
 .tb-durations button.active{background:#edebe9;border-color:#323130}
 /* World Language questions are held up for the players to read and translate,
    not read aloud, so they get the whole screen at the largest size that fits. */
 #langShow{position:fixed;inset:0;z-index:2000;background:#fff;display:none;
   flex-direction:column;padding:2vmin 3vmin;font-family:Georgia,'Times New Roman',serif}
 #langShow.on{display:flex}
 #langFit{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;
   gap:1.5vmin;overflow:hidden}
 .lang-line{display:flex;align-items:baseline;gap:.6em;line-height:1.15}
 .lang-tag{flex:0 0 auto;font-family:'Segoe UI',system-ui,sans-serif;font-weight:700;
   color:#8a8886;font-size:.32em;letter-spacing:.08em}
 .lang-text{flex:1 1 auto;color:#111}
 #langFoot{flex:0 0 auto;display:flex;align-items:center;gap:1rem;padding-top:1.5vmin;
   border-top:1px solid #e1dfdd;font-family:'Segoe UI',system-ui,sans-serif}
 #langClock{font-size:2.6rem;font-weight:600;font-variant-numeric:tabular-nums;
   min-width:5rem;text-align:right}
 #langClock.low{color:#a4500f}
 #langClock.done{color:#a4262c}
 #langHint{flex:1 1 auto;font-size:.95rem;color:#605e5c}
 /* the only thing we impose on MODAQ's row: a positioning context for the clock */
 .kshsaa-cycle-row{position:relative}
 /* Fallback for windows too narrow to hold the clock beside a centred nav row:
    back into the flow, where the whole cluster centres together and wraps
    rather than running under MODAQ's event pane. Applied by measurement, not a
    guessed breakpoint - how much room there is depends on MODAQ's own layout. */
 #timerBar.tb-inflow{position:static;margin-left:0}
 .kshsaa-cycle-row.tb-row-inflow{display:flex;align-items:center;justify-content:center;
   gap:8px;flex-wrap:wrap}
</style>
</head><body>

<div class="kshsaa-bar py-2 mb-3">
  <div class="container kshsaa-nav" style="max-width:1100px">
    <a class="kshsaa-home" href="/">&larr; QBReader</a>
    <span class="kshsaa-links">
      <a href="/kshsaa-play" class="active">Read a round</a>
      <a href="/kshsaa-round">Download packet</a>
      <a href="/kshsaa-stats">Practice stats</a>
      <a href="/kshsaa-questions">Question bank</a>
      <a href="/kshsaa-spanish/">Spanish Practice</a>
    </span>
  </div>
</div>

<div class="container-fluid pb-3">
  <div id="gate" class="setup d-none">
    <h1 class="h4">Read a round</h1>
    <p class="text-secondary small">Log in with the team password so player names autocomplete
    and the game can save itself to your stats when it ends.</p>
    <div class="card" style="max-width:420px"><div class="card-body">
      <label class="form-label">Team password</label>
      <input type="password" class="form-control mb-2" id="gatePw">
      <button class="btn btn-primary" id="gateBtn">Enter</button>
      <div class="small text-danger mt-2" id="gateErr"></div>
    </div></div>
  </div>

  <div id="setup" class="setup d-none">
    <h1 class="h4">Read a round</h1>
    <p class="text-secondary small mb-3">Generates a fresh randomized 16-question round
    (1 world language, 3 language arts, 3 science/health, 3 social studies, 3 math,
    2 fine arts, 1 year in review) and opens it in MODAQ with KSHSAA scoring already set:
    10 points per tossup, no powers, no bonuses, &minus;5 on a wrong interruption.</p>

    <datalist id="knownPlayers"></datalist>

    <div class="mb-3">
      <label class="form-label fw-semibold">Practice label</label>
      <input class="form-control" id="label" placeholder="Tuesday practice, game 2">
      <div class="form-text">Saved with the stats so you can find this game later.</div>
    </div>

    <div class="mb-3 d-none" id="lineupBox">
      <label class="form-label fw-semibold">Reuse a lineup</label>
      <select class="form-select form-select-sm mb-2" id="lineupGame"></select>
      <div id="lineupTeams"></div>
      <div class="form-text">Load one side and retype the other, or load both. Team names come
      along with the players.</div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <input class="form-control mb-2 fw-semibold" id="t1" placeholder="Team 1" aria-label="Team 1 name">
        <div id="p1"></div>
        <button class="btn btn-sm btn-outline-secondary mt-1" data-add="p1">+ Add player</button>
      </div>
      <div class="col-md-6">
        <input class="form-control mb-2 fw-semibold" id="t2" placeholder="Team 2" aria-label="Team 2 name">
        <div id="p2"></div>
        <button class="btn btn-sm btn-outline-secondary mt-1" data-add="p2">+ Add player</button>
      </div>
    </div>
    <div class="form-text mt-1">Start typing a name and pick the suggestion if the player already
    has stats &mdash; spelling has to match for their history to line up.</div>

    <div class="form-check mt-3">
      <input class="form-check-input" type="checkbox" id="conv">
      <label class="form-check-label small" for="conv">Include converted quizbowl questions (Varsity questions)</label>
    </div>

    <div class="form-check mt-2">
      <input class="form-check-input" type="checkbox" id="gen">
      <label class="form-check-label small" for="gen">Include generated questions for math</label>
    </div>

    <div id="nameCheck" class="alert alert-warning mt-3 d-none"></div>

    <button class="btn btn-primary mt-3" id="go">Generate round &amp; start reading</button>
    <span class="ms-2 small text-secondary" id="status"></span>

    <p class="small text-secondary mt-3 mb-0">When the game ends, click &ldquo;Save to team stats&rdquo; in the
    reader&rsquo;s menu. On the KSHSAA neg rule: MODAQ applies &minus;5 to any wrong interruption, but per the
    manual a <em>second</em> team that interrupts and misses takes no penalty &mdash; don&rsquo;t record the neg then.</p>
    <p class="small mt-2"><a href="/kshsaa-round">Prefer a file to download instead?</a></p>
  </div>

  <div id="timerBar" class="d-none">
    <span id="tpClock" class="tb-clock">10.0</span>
    <button type="button" class="tb-btn tb-btn-primary" id="tpToggle"
      title="Start or stop the clock (spacebar)">Start</button>
    <button type="button" class="tb-btn" id="tpOther"
      title="Wrong answer with no interruption: the other team gets the time left plus five seconds">+5s</button>
    <button type="button" class="tb-btn" id="tpReset"
      title="Put the clock back to this question's full limit">Reset</button>
    <button type="button" class="tb-btn" id="tpDisplay"
      title="Hold this question up full screen (D)">Enlarge</button>
    <span class="tb-durations" id="tpDurations"
      title="Time limit for this question - set automatically, override here"></span>
  </div>

  <div id="langShow">
    <div id="langFit"></div>
    <div id="langFoot">
      <span id="langClock">10.0</span>
      <span id="langHint">Spacebar starts and stops the clock. Escape or D exits.</span>
      <button type="button" class="tb-btn" id="langClose">Exit</button>
    </div>
  </div>

  <div id="roundWarn" class="alert alert-warning py-2 small d-none"></div>

  <div id="modaq"></div>
</div>

<script type="module">
const $ = id => document.getElementById(id);
// player names reach innerHTML in several places below, and a name is free text
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const REACT = 'https://esm.sh/react@18.3.1';
const REACTDOM = 'https://esm.sh/react-dom@18.3.1/client';
// mobx is pinned to 6 as well: modaq asks for ^6.5.0, but left unpinned esm.sh
// resolves the "latest" tag and hands it mobx 7, which throws during a round
const MODAQ = 'https://esm.sh/modaq@1.41.1?deps=react@18.3.1,react-dom@18.3.1,mobx@6.16.1';

const KSHSAA_FORMAT = {
  displayName: 'KSHSAA Scholars Bowl',
  negValue: -5,
  powers: [],
  bonusesBounceBack: false,
  minimumOvertimeQuestionCount: 1,
  overtimeIncludesBonuses: false,
  pronunciationGuideMarkers: ['(', ')'],
  timeoutsAllowed: 0,
  version: '2'
};

let KNOWN = [];

function renumber (boxId) {
  Array.from($(boxId).querySelectorAll('.pname')).forEach((input, i) => {
    input.placeholder = 'Player ' + (i + 1);
  });
}

function addPlayerBox (boxId) {
  const wrap = document.createElement('div');
  wrap.className = 'input-group input-group-sm mb-1';

  const input = document.createElement('input');
  input.className = 'form-control pname';
  input.setAttribute('list', 'knownPlayers');
  input.placeholder = 'Player ' + ($(boxId).querySelectorAll('.pname').length + 1);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'btn btn-outline-secondary';
  remove.title = 'Remove this player';
  remove.textContent = '\\u00d7';
  remove.onclick = () => {
    if ($(boxId).querySelectorAll('.pname').length <= 1) { input.value = ''; return; }
    wrap.remove();
    renumber(boxId);
  };

  wrap.appendChild(input);
  wrap.appendChild(remove);
  $(boxId).appendChild(wrap);
  return input;
}

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.onclick = () => addPlayerBox(btn.getAttribute('data-add')).focus();
});

let LINEUPS = [];

// replace one side's roster wholesale, keeping a few blank rows to add to
function fillSide (boxId, teamInputId, teamName, playerNames) {
  $(teamInputId).value = teamName || '';
  const box = $(boxId);
  box.innerHTML = '';
  for (const name of playerNames.slice(0, 12)) { addPlayerBox(boxId).value = name; }
  while (box.querySelectorAll('.pname').length < 5) { addPlayerBox(boxId); }
  renumber(boxId);
}

function renderLineupChoices () {
  const game = LINEUPS[Number($('lineupGame').value)];
  const box = $('lineupTeams');
  if (!game) { box.innerHTML = ''; return; }
  let h = '';
  game.teams.forEach((t, i) => {
    h += '<div class="d-flex align-items-center gap-2 mb-1">' +
      '<span class="small flex-grow-1"><strong>' + esc(t.name) + '</strong> &mdash; ' +
      esc(t.players.join(', ')) + '</span>' +
      '<button type="button" class="btn btn-sm btn-outline-secondary loadSide" data-team="' + i +
      '" data-side="1">&rarr; Team 1</button>' +
      '<button type="button" class="btn btn-sm btn-outline-secondary loadSide" data-team="' + i +
      '" data-side="2">&rarr; Team 2</button></div>';
  });
  if (game.teams.length >= 2) {
    h += '<button type="button" class="btn btn-sm btn-outline-primary mt-1" id="loadBoth">Load both sides</button>';
  }
  box.innerHTML = h;

  Array.from(box.querySelectorAll('.loadSide')).forEach(btn => {
    btn.onclick = () => {
      const t = game.teams[Number(btn.dataset.team)];
      const side = btn.dataset.side === '1' ? ['p1', 't1'] : ['p2', 't2'];
      fillSide(side[0], side[1], t.name, t.players);
    };
  });
  const both = box.querySelector('#loadBoth');
  if (both) {
    both.onclick = () => {
      fillSide('p1', 't1', game.teams[0].name, game.teams[0].players);
      fillSide('p2', 't2', game.teams[1].name, game.teams[1].players);
    };
  }
}

function loadLineups () {
  fetch('/kshsaa-stats/lineups').then(r => r.ok ? r.json() : null).then(d => {
    LINEUPS = (d && d.games) || [];
    if (!LINEUPS.length) return;
    $('lineupGame').innerHTML = LINEUPS.map((g, i) =>
      '<option value="' + i + '">' + esc(g.label) + ' — ' +
      new Date(g.playedAt).toLocaleDateString() + '</option>').join('');
    $('lineupGame').onchange = renderLineupChoices;
    renderLineupChoices();
    $('lineupBox').classList.remove('d-none');
  }).catch(() => {});
}

// login gate: names must be loaded before a round starts, so duplicates can't slip in
function startApp () {
  $('gate').classList.add('d-none');
  $('setup').classList.remove('d-none');
  for (const box of ['p1', 'p2']) {
    if (!$(box).querySelectorAll('.pname').length) {
      for (let i = 0; i < 5; i++) addPlayerBox(box);
    }
  }
  // a round started before the roster arrives would flag every player as new,
  // so hold the button until the fetch settles either way
  $('go').disabled = true;
  $('status').textContent = 'loading player names...';
  fetch('/kshsaa-stats/names').then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.names) return;
    KNOWN = d.names;
    $('knownPlayers').innerHTML = KNOWN.map(n => '<option value="' + esc(n) + '">').join('');
  }).catch(() => {}).finally(() => {
    $('go').disabled = false;
    $('status').textContent = '';
  });
  loadLineups();
}

fetch('/kshsaa-stats/me').then(r => r.json()).then(d => {
  if (d.authed) startApp();
  else $('gate').classList.remove('d-none');
}).catch(() => $('gate').classList.remove('d-none'));

$('gateBtn').onclick = async () => {
  const r = await fetch('/kshsaa-stats/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: $('gatePw').value })
  });
  if (r.ok) startApp();
  else {
    const d = await r.json().catch(() => ({}));
    $('gateErr').textContent = d.error || 'wrong password';
  }
};
$('gatePw').onkeydown = e => { if (e.key === 'Enter') $('gateBtn').click(); };

function lev (a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i - 1] === a[j - 1]
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

function suggestionsFor (name) {
  const n = name.toLowerCase();
  return KNOWN.filter(k => {
    const kk = k.toLowerCase();
    if (kk === n) return false;
    if (kk.startsWith(n) || n.startsWith(kk)) return true;
    // edit distance is never smaller than the length gap, so this skips the
    // quadratic work for names that cannot possibly be within two edits
    return Math.abs(kk.length - n.length) <= 2 && lev(kk, n) <= 2;
  }).slice(0, 4);
}

function nameInputs () {
  return [
    ...Array.from($('p1').querySelectorAll('.pname')).map(i => ({ input: i, team: $('t1').value.trim() || 'Team 1' })),
    ...Array.from($('p2').querySelectorAll('.pname')).map(i => ({ input: i, team: $('t2').value.trim() || 'Team 2' }))
  ].filter(e => e.input.value.trim());
}

// returns players array, or null if the moderator still has names to resolve
function validatedPlayers () {
  const warn = $('nameCheck');
  const entries = nameInputs();

  // snap to existing capitalization so "max" can never become a second "Max"
  entries.forEach(e => {
    const v = e.input.value.trim();
    const match = KNOWN.find(k => k.toLowerCase() === v.toLowerCase());
    e.input.value = match || v;
  });

  const seen = {};
  for (const e of entries) {
    const v = e.input.value.trim().toLowerCase();
    if (seen[v]) {
      warn.className = 'alert alert-danger mt-3';
      warn.innerHTML = '<strong>' + esc(e.input.value) + '</strong> is entered twice. Each player can only be on one team, once.';
      return null;
    }
    seen[v] = true;
  }

  const unknown = entries.filter(e => !KNOWN.some(k => k === e.input.value.trim()));
  if (unknown.length) {
    let h = '<strong>New names detected.</strong> Pick the existing player if this is the same person &mdash; ' +
      'otherwise confirm they are new, so stats do not get split across spellings.<div class="mt-2">';
    unknown.forEach((e, idx) => {
      const typed = e.input.value.trim();
      const sugg = suggestionsFor(typed);
      h += '<div class="row g-2 align-items-center mb-1"><div class="col-sm-4"><code>' + esc(typed) + '</code></div>' +
        '<div class="col-sm-8"><select class="form-select form-select-sm resolve" data-idx="' + idx + '">';
      sugg.forEach(s => { h += '<option value="' + esc(s) + '">use existing: ' + esc(s) + '</option>'; });
      h += '<option value="__new__">add "' + esc(typed) + '" as a new player</option></select></div></div>';
    });
    h += '</div><button class="btn btn-sm btn-primary mt-2" id="resolveBtn">Confirm names</button>';
    warn.className = 'alert alert-warning mt-3';
    warn.innerHTML = h;
    document.getElementById('resolveBtn').onclick = () => {
      document.querySelectorAll('.resolve').forEach(sel => {
        const e = unknown[Number(sel.getAttribute('data-idx'))];
        if (sel.value !== '__new__') e.input.value = sel.value;
        else if (!KNOWN.includes(e.input.value.trim())) KNOWN.push(e.input.value.trim());
      });
      warn.classList.add('d-none');
      $('go').click();
    };
    return null;
  }

  warn.classList.add('d-none');
  const players = entries.map(e => ({ name: e.input.value.trim(), teamName: e.team, isStarter: true }));
  // starters: first four listed per team
  const perTeam = {};
  players.forEach(p => {
    perTeam[p.teamName] = (perTeam[p.teamName] || 0) + 1;
    p.isStarter = perTeam[p.teamName] <= 4;
  });
  return players;
}

// ---------- World Language display ----------
// Per the manual these carry the same expression in French, German and Spanish,
// in that order, and the moderator holds the text up rather than reading it.
let ROUND = [];
let CURRENT_QUESTION = 1;

const DISPLAY_CATEGORIES = ['World Language', 'Foreign Language'];
const LANG_TAGS = ['FRENCH', 'GERMAN', 'SPANISH', 'LATIN'];

/**
 * Splits "FRENCH ... GERMAN ... SPANISH ..." into labelled lines.
 * @param {string} text
 * @returns {{tag: ?string, text: string}[]} one entry per language, or a single
 * unlabelled entry when the markers are missing -- 43 of the 653 in the archive
 * are mis-tagged and are really ordinary questions.
 */
function splitLanguages (text) {
  // strip a leading [30 sec] marker without a regex: backslashes inside this
  // page's template literal collapse before the browser ever sees them
  const trimmed = text.trim();
  const close = trimmed.indexOf(']');
  const clean = (trimmed.charAt(0) === '[' && close !== -1 ? trimmed.slice(close + 1) : trimmed).trim();
  const found = [];
  for (const tag of LANG_TAGS) {
    const at = clean.toUpperCase().indexOf(tag);
    if (at !== -1) { found.push({ tag, at }); }
  }
  if (found.length < 2) { return [{ tag: null, text: clean }]; }
  found.sort((a, b) => a.at - b.at);
  return found.map((f, i) => {
    const from = f.at + f.tag.length;
    const to = i + 1 < found.length ? found[i + 1].at : clean.length;
    return { tag: f.tag, text: clean.slice(from, to).trim() };
  }).filter(l => l.text);
}

/** Grows the text to the largest size that still fits the box. */
function fitText (box) {
  let lo = 12;
  let hi = 260;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    box.style.fontSize = mid + 'px';
    const fits = box.scrollHeight <= box.clientHeight && box.scrollWidth <= box.clientWidth;
    if (fits) { lo = mid; } else { hi = mid; }
  }
  box.style.fontSize = lo + 'px';
}

function showLanguage (question) {
  const lines = splitLanguages(question);
  $('langFit').innerHTML = lines.map(l =>
    '<div class="lang-line">' +
    (l.tag ? '<span class="lang-tag">' + esc(l.tag) + '</span>' : '') +
    '<span class="lang-text">' + esc(l.text) + '</span></div>').join('');
  $('langShow').classList.add('on');
  fitText($('langFit'));
}

function hideLanguage () {
  $('langShow').classList.remove('on');
}

const languageShowing = () => $('langShow').classList.contains('on');

// ---------- answer clock (KSHSAA timing) ----------
const TIMER = { duration: 10, remaining: 10, running: false, handle: null, last: 0 };
const DURATIONS = [10, 30, 45, 60, 120];
const DEFAULT_SECONDS = 10;
// seconds allowed on each question of this round, read off the [30 sec] markers
let LIMITS = [];

function tpRender () {
  for (const id of ['tpClock', 'langClock']) {
    const el = $(id);
    if (!el) { continue; }
    el.textContent = TIMER.remaining.toFixed(1);
    el.classList.toggle('low', TIMER.remaining <= 3 && TIMER.remaining > 0);
    el.classList.toggle('done', TIMER.remaining <= 0);
  }
}

function tpTick () {
  const now = performance.now();
  TIMER.remaining = Math.max(0, TIMER.remaining - (now - TIMER.last) / 1000);
  TIMER.last = now;
  tpRender();
  if (TIMER.remaining <= 0) {
    tpStop();
    const el = $('tpClock');
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1500);
  }
}

function tpSyncToggle () {
  const b = $('tpToggle');
  if (b) b.textContent = TIMER.running ? 'Stop' : 'Start';
}

function tpStart () {
  if (TIMER.running) return;
  if (TIMER.remaining <= 0) TIMER.remaining = TIMER.duration;
  TIMER.running = true;
  TIMER.last = performance.now();
  TIMER.handle = setInterval(tpTick, 100);
  tpSyncToggle();
}

function tpStop () {
  TIMER.running = false;
  if (TIMER.handle) clearInterval(TIMER.handle);
  TIMER.handle = null;
  tpSyncToggle();
}

// no interruption, wrong answer: opponents get the time left plus five seconds
function tpAddFive () {
  tpStop();
  TIMER.remaining = TIMER.remaining + 5;
  tpRender();
  tpStart();
}

// interruption, wrong answer (-5): the question is reread in full, so the
// other team starts again from the whole time limit
function tpRereadReset () {
  tpStop();
  TIMER.remaining = TIMER.duration;
  tpRender();
}

// a new question means a fresh clock, at whatever limit that question carries.
// The number itself is not echoed anywhere here - MODAQ's own nav row and its
// event pane both already show it.
function tpForQuestion (n) {
  CURRENT_QUESTION = n;
  tpSet(LIMITS[n - 1] || DEFAULT_SECONDS, false);
  // never opens on its own - the moderator presses Enlarge when they are ready
  // to hold the question up. Close it on a question change so it cannot linger
  // over the next one.
  hideLanguage();
  markDisplayButton(n);
}

// a World Language question is the one that gets held up rather than read, so
// make the button obvious on those without forcing the panel open
function markDisplayButton (n) {
  const q = ROUND[n - 1];
  const wanted = Boolean(q) && DISPLAY_CATEGORIES.indexOf(q.category) !== -1;
  const btn = $('tpDisplay');
  if (!btn) { return; }
  btn.classList.toggle('tb-btn-primary', wanted);
  btn.title = wanted
    ? 'This one is held up for the players to read, not read aloud (D)'
    : 'Hold this question up full screen (D)';
}

// MODAQ exposes no callbacks, so read its DOM instead. Two things matter: the
// question number (which limit applies) and a team score going down, meaning a
// neg was scored - under KSHSAA the question is then reread in full, so the
// clock goes back to the top rather than carrying the remainder over.
// The clock lives outside #modaq, so updating it cannot retrigger the observer.
function watchReader (teamNames) {
  const root = $('modaq');
  const bar = $('timerBar');
  let scoreEl = null;
  let lastScores = null;
  let lastQuestion = null;
  let queued = false;

  // MODAQ's nav row, found by role rather than by generated class name (those
  // change between MODAQ builds). Note it is not always both buttons: Next is
  // gone on the last question of the round, so climb until the candidate holds
  // whichever nav buttons exist plus the "Question #" label.
  const findCycleRow = () => {
    const nav = [...root.querySelectorAll('button')].filter(b => {
      const t = b.textContent || '';
      return t.indexOf('Previous') !== -1 || t.indexOf('Next') !== -1;
    });
    if (!nav.length) return null;
    let row = nav[0].parentElement;
    while (row && row !== root &&
           !(nav.every(b => row.contains(b)) && /Question\\s*#/i.test(row.textContent))) {
      row = row.parentElement;
    }
    return row && row !== root ? row : null;
  };

  // Hanging off the right of a centred row only works while there is room to
  // the right of it. Ask the layout rather than guessing a breakpoint: try the
  // hung position, and if the bar would run past the row's container - where
  // MODAQ's event pane begins - drop back into the flow.
  const fitToRow = row => {
    bar.classList.remove('tb-inflow');
    row.classList.remove('tb-row-inflow');
    const host = row.parentElement;
    if (!host) return;
    const fits = bar.getBoundingClientRect().right <= host.getBoundingClientRect().right;
    bar.classList.toggle('tb-inflow', !fits);
    row.classList.toggle('tb-row-inflow', !fits);
  };

  // React owns that row and rebuilds it, so treat placement as something to
  // restore continuously rather than to do once
  const anchor = () => {
    const row = findCycleRow();
    if (!row) return;
    if (bar.parentElement !== row) {
      row.classList.add('kshsaa-cycle-row');
      row.appendChild(bar);
    }
    fitToRow(row);
  };

  window.addEventListener('resize', anchor);

  // matching on the real team names rather than the literal word "Team" keeps
  // this working once the moderator renames the teams
  const looksLikeScoreboard = t =>
    t.length < 200 && /\\d/.test(t) && teamNames.every(n => t.indexOf(n) !== -1);

  const findScoreEl = () => {
    let best = null;
    root.querySelectorAll('*').forEach(node => {
      if (node.children.length > 3 || bar.contains(node)) return;
      const t = (node.textContent || '').trim();
      if (looksLikeScoreboard(t) && (!best || t.length < best.textContent.trim().length)) best = node;
    });
    return best;
  };

  const scoresFrom = text => teamNames.map(n => {
    const at = text.indexOf(n);
    if (at === -1) return null;
    const m = text.slice(at + n.length).match(/-?\\d+/);
    return m ? Number(m[0]) : null;
  });

  const scan = () => {
    queued = false;
    anchor();

    // read the number off the nav row once anchored: it is a few dozen
    // characters rather than the whole reader, and cannot pick up a
    // "Question #" that belongs to some other part of MODAQ's UI
    const row = bar.parentElement;
    const navText = (row && row !== root ? row.textContent : root.textContent) || '';
    const qm = navText.match(/Question\\s*#\\s*(\\d+)/i);
    const q = qm ? Number(qm[1]) : null;
    if (q && q !== lastQuestion) {
      lastQuestion = q;
      tpForQuestion(q);
    }

    if (!scoreEl || !root.contains(scoreEl)) {
      scoreEl = findScoreEl();
      lastScores = scoreEl ? scoresFrom(scoreEl.textContent) : null;
      return;
    }
    const now = scoresFrom(scoreEl.textContent);
    if (lastScores) {
      for (let i = 0; i < now.length; i++) {
        if (now[i] != null && lastScores[i] != null && now[i] < lastScores[i]) { tpRereadReset(); break; }
      }
    }
    lastScores = now;
  };

  // React re-renders in bursts; one debounced pass per burst beats polling.
  // The bar now lives inside root, so its own ticking clock would otherwise
  // wake this ten times a second - ignore bursts that are entirely our own.
  new MutationObserver(records => {
    if (records.every(r => bar.contains(r.target))) return;
    if (queued) return;
    queued = true;
    setTimeout(scan, 150);
  }).observe(root, { childList: true, subtree: true, characterData: true });
  scan();
}

function tpSet (seconds, alsoStart) {
  tpStop();
  TIMER.duration = seconds;
  TIMER.remaining = seconds;
  tpRender();
  Array.from($('tpDurations').children).forEach(b => {
    b.classList.toggle('active', Number(b.dataset.secs) === seconds);
  });
  if (alsoStart) tpStart();
}

function setupTimer (round, teamNames) {
  ROUND = round;
  // KSHSAA gives longer limits on computation questions; the generator tags them
  LIMITS = round.map(q => {
    const m = q.question.match(/^\\[(\\d+)\\s*sec\\]/i);
    return m ? Number(m[1]) : DEFAULT_SECONDS;
  });

  // the override list has to include any limit this round actually uses, or
  // tpSet could not highlight the value it just applied
  const choices = [...new Set(DURATIONS.concat(LIMITS))].sort((a, b) => a - b);
  $('tpDurations').innerHTML = choices
    .map(s => '<button type="button" data-secs="' + s + '">' + s + 's</button>').join('');
  Array.from($('tpDurations').children).forEach(b => {
    b.onclick = () => tpSet(Number(b.dataset.secs), false);
  });

  const timed = LIMITS
    .map((s, i) => s === DEFAULT_SECONDS ? null : 'Q' + (i + 1) + ': ' + s + 's')
    .filter(Boolean);
  // explanation lives in a tooltip so the bar stays compact inside the reader
  $('timerBar').title = '10s to buzz by default, set automatically per question. ' +
    '"+5s" gives the opponents the time left plus five seconds after a wrong answer with no ' +
    'interruption; on an interruption the question is reread and the clock resets on its own.' +
    (timed.length ? ' Longer limits this round: ' + timed.join(', ') + '.' : '');

  $('langClose').onclick = hideLanguage;
  $('langShow').onclick = e => { if (e.target === $('langShow')) { hideLanguage(); } };
  window.addEventListener('resize', () => { if (languageShowing()) { fitText($('langFit')); } });

  $('tpDisplay').onclick = () => {
    if (languageShowing()) { hideLanguage(); return; }
    const q = ROUND[(CURRENT_QUESTION || 1) - 1];
    if (q) { showLanguage(q.question); }
  };

  $('tpToggle').onclick = () => { TIMER.running ? tpStop() : tpStart(); };
  $('tpReset').onclick = () => tpSet(TIMER.duration, false);
  $('tpOther').onclick = tpAddFive;

  document.addEventListener('keydown', e => {
    const t = e.target;
    const tag = (t && t.tagName ? t.tagName : '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) { return; }
    if (e.key === 'Escape' && languageShowing()) { hideLanguage(); e.preventDefault(); return; }
    if (e.key === 'd' || e.key === 'D') { $('tpDisplay').click(); e.preventDefault(); }
  });

  // spacebar starts/stops the clock, unless the moderator is typing somewhere
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    const t = e.target;
    const tag = (t && t.tagName ? t.tagName : '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
    if (tag === 'button') t.blur();   // stop space from re-firing the focused button
    e.preventDefault();
    TIMER.running ? tpStop() : tpStart();
  });
  tpForQuestion(1);
  $('timerBar').classList.remove('d-none');
  watchReader(teamNames);
}

$('go').onclick = async () => {
  const players = validatedPlayers();
  if (!players) return;
  if (players.length < 2) { $('status').textContent = 'add at least one player per team'; return; }

  $('go').disabled = true;
  $('status').textContent = 'building round...';
  try {
    const res = await fetch('/kshsaa-round/generate?converted=' + ($('conv').checked ? '1' : '0') +
      '&generated=' + ($('gen').checked ? '1' : '0'));
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // metadata is MODAQ's own per-question field: it renders it as <Social Studies>
    // beside the answer, so the moderator can see which subject they are reading.
    const packet = {
      tossups: data.round.map(q => ({ question: q.question, answer: q.answer, metadata: q.category })),
      bonuses: []
    };
    const label = $('label').value.trim() || 'Practice';
    // sent with the game so stats read the real category of each question
    // instead of inferring it from the slot number
    const categories = data.round.map(q => q.category);

    const teamNames = [...new Set(players.map(p => p.teamName))];

    $('status').textContent = 'loading reader...';
    const [React, ReactDOM, Modaq] = await Promise.all([
      import(REACT), import(REACTDOM), import(MODAQ)
    ]);

    // Celerity needs a denominator. MODAQ reports a buzz as an index into the
    // question's BUZZABLE words -- a pronunciation guide is skipped -- so count
    // the same way, with MODAQ's own tokeniser. This has to come after the
    // import above: Modaq is const, so touching it earlier hits the temporal
    // dead zone and the round never builds.
    const buzzableWords = (text) => {
      const tokens = Modaq.splitFormattedTextIntoWords(text)
        .map(w => Array.prototype.reduce.call(w, (acc, s) => acc + s.text, ''));
      let depth = 0;
      let count = 0;
      for (const token of tokens) {
        const opens = token.split('(').length - 1;
        const closes = token.split(')').length - 1;
        const insideGuide = depth > 0 || opens > 0;
        depth = Math.max(0, depth + opens - closes);
        if (!insideGuide) { count++; }
      }
      return count;
    };
    const wordCounts = data.round.map(q => buzzableWords(q.question));
    const charCounts = data.round.map(q => q.question.length);

    $('setup').style.display = 'none';
    if (data.short && data.short.length) {
      $('roundWarn').textContent = 'This round is ' + data.round.length + ' questions, not 16 - ' +
        'the archive ran short on ' + data.short.join(', ') + '.';
      $('roundWarn').classList.remove('d-none');
    }
    setupTimer(data.round, teamNames);
    ReactDOM.createRoot($('modaq')).render(
      React.createElement(Modaq.ModaqControl, {
        packet,
        players,
        gameFormat: KSHSAA_FORMAT,
        persistState: false,
        storeName: 'kshsaa-modaq',
        customExport: {
          label: 'Save to team stats',
          type: 'QBJ',
          // MODAQ reads the returned object, so always return {isError, message}
          onExport: async (match) => {
            const post = () => fetch('/kshsaa-stats/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game: match, label, categories, wordCounts, charCounts })
            });
            try {
              let r = await post();
              if (r.status === 401) {
                const pw = window.prompt('Team stats password (to save this game):');
                if (!pw) {
                  return { isError: true, message: 'Not saved. Click "Save to team stats" again when ready.' };
                }
                const login = await fetch('/kshsaa-stats/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: pw })
                });
                if (!login.ok) {
                  return { isError: true, message: 'Wrong password - nothing was saved. Click save again to retry.' };
                }
                r = await post();
              }
              const d = await r.json().catch(() => ({}));
              if (r.ok) {
                return { isError: false, message: 'Saved to team stats (' + (d.buzzes || 0) + ' buzzes recorded).' };
              }
              return { isError: true, message: 'Could not save: ' + (d.error || r.status) };
            } catch (e) {
              return { isError: true, message: 'Could not save: ' + e.message };
            }
          }
        }
      })
    );
  } catch (e) {
    $('status').innerHTML = '<span class="text-danger">error: ' + esc(e.message) +
      ' &mdash; <a href="/kshsaa-round">use the download page instead</a></span>';
    $('go').disabled = false;
  }
};
</script>
</body></html>`;

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(PAGE);
});

export default router;
