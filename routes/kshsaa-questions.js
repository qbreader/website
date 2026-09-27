// Author and review KSHSAA questions.
//
// The archive is thin in places -- Mathematics especially, where the "include
// converted quizbowl questions" toggle adds nothing at all -- so this page is
// where new questions get reviewed one at a time and promoted into the live
// question collection.
//
// INSTALL
//   In app.js, next to the other kshsaa routes but BELOW cookieSession (this
//   route reads req.session for auth):
//     import kshsaaQuestionsRouter from './routes/kshsaa-questions.js';
//     app.use('/kshsaa-questions', kshsaaQuestionsRouter);

import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { qbreader } from '../database/databases.js';
import { packets, sets, tossups } from '../database/qbreader/collections.js';
import { perTossupData } from '../database/account-info/collections.js';
import { CATEGORY_BY_QUESTION } from './kshsaa-round.js';
import { requireAuth } from './kshsaa-stats.js';

const router = Router();
const pending = qbreader.collection('kshsaa_pending_questions');

// Anything under this prefix is opt-in on the round pages, the same way the
// converted quizbowl sets are. Keep it in sync with kshsaa-round.js.
const GENERATED_SET_PREFIX = 'SJA Generated';

// KSHSAA subject -> the site's own [category, subcategory, alternate_subcategory].
// These are what kshsaa-round.js's DISTRIBUTION filters on, so a question with
// the wrong triple here would never be picked for a round.
const SUBJECTS = {
  Mathematics: ['Science', 'Other Science', 'Math'],
  'Science/Health': ['Science', 'Other Science', null],
  'Language Arts': ['Literature', 'Other Literature', null],
  'Social Studies': ['Social Science', 'Social Science', null],
  'Fine Arts': ['Fine Arts', 'Other Fine Arts', null],
  'World Language': ['Other Academic', 'Other Academic', null],
  'Year in Review': ['Current Events', 'Current Events', null]
};

// difficulty 2 is what real KSHSAA questions carry, so generated ones behave the
// same in solo play and multiplayer; the set name is what marks them apart.
const DIFFICULTY = 2;

const sanitize = s => String(s ?? '')
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .trim();

/**
 * Finds or creates the generated set and packet for a subject.
 * @param {string} subject - a key of SUBJECTS
 * @returns {Promise<{setId: ObjectId, setName: string, packetId: ObjectId}>}
 */
async function ensureSetAndPacket (subject) {
  const setName = GENERATED_SET_PREFIX + ' - ' + subject;
  const year = new Date().getFullYear();

  let set = await sets.findOne({ name: setName });
  if (!set) {
    const setId = new ObjectId();
    await sets.insertOne({
      _id: setId,
      name: setName,
      year,
      difficulty: DIFFICULTY,
      standard: true,
      kshsaaImport: true,
      sjaGenerated: true
    });
    set = { _id: setId, name: setName };
  }

  let packet = await packets.findOne({ 'set._id': set._id });
  if (!packet) {
    const packetId = new ObjectId();
    await packets.insertOne({
      _id: packetId,
      name: 'Generated',
      number: 1,
      set: { _id: set._id, name: setName },
      kshsaaImport: true
    });
    packet = { _id: packetId };
  }

  return { setId: set._id, setName, packetId: packet._id };
}

/**
 * Writes one approved question into the live collections.
 *
 * Both documents matter: recordTossupData only $pushes onto an existing
 * per-tossup-data document, so a tossup without one silently drops every buzz
 * ever played on it.
 * @param {{subject: string, question: string, answer: string, timedSeconds: ?number}} q
 * @returns {Promise<ObjectId>} the new tossup's id
 */
async function publishQuestion (q) {
  const [category, subcategory, alternateSubcategory] = SUBJECTS[q.subject];
  const { setId, setName, packetId } = await ensureSetAndPacket(q.subject);
  const number = await tossups.countDocuments({ 'set._id': setId }) + 1;
  const tossupId = new ObjectId();
  const year = new Date().getFullYear();

  await tossups.insertOne({
    _id: tossupId,
    question: q.question,
    question_sanitized: sanitize(q.question),
    answer: q.answer,
    answer_sanitized: sanitize(q.answer),
    category,
    subcategory,
    alternate_subcategory: alternateSubcategory,
    kshsaa_category: q.subject,
    timed_seconds: q.timedSeconds ?? null,
    number,
    difficulty: DIFFICULTY,
    set: { _id: setId, name: setName, year, standard: true },
    packet: { _id: packetId, name: 'Generated', number: 1 },
    kshsaaImport: true,
    sjaGenerated: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await perTossupData.insertOne({
    _id: tossupId,
    category,
    data: [],
    difficulty: DIFFICULTY,
    set_id: setId,
    subcategory,
    ...(alternateSubcategory && { alternate_subcategory: alternateSubcategory })
  });

  return tossupId;
}

const cleanSubject = s => (Object.prototype.hasOwnProperty.call(SUBJECTS, s) ? s : null);
const cleanSeconds = (v) => {
  if (v === '' || v === null || v === undefined) { return null; }
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 600 ? Math.round(n) : null;
};

// ---------- endpoints ----------

router.get('/list', requireAuth, async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
    ? req.query.status
    : 'pending';
  const [rows, counts] = await Promise.all([
    pending.find({ status }).sort({ subject: 1, createdAt: 1 }).limit(500).toArray(),
    pending.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray()
  ]);
  const tally = { pending: 0, approved: 0, rejected: 0 };
  counts.forEach(c => { if (c._id in tally) { tally[c._id] = c.n; } });
  res.json({
    subjects: Object.keys(SUBJECTS),
    counts: tally,
    questions: rows.map(r => ({
      id: String(r._id),
      subject: r.subject,
      topic: r.topic ?? null,
      question: r.question,
      answer: r.answer,
      solution: r.solution ?? null,
      timedSeconds: r.timedSeconds ?? null
    }))
  });
});

router.post('/update', requireAuth, async (req, res) => {
  try {
    const set = {};
    if (typeof req.body.question === 'string') { set.question = req.body.question.trim(); }
    if (typeof req.body.answer === 'string') { set.answer = req.body.answer.trim(); }
    if ('timedSeconds' in req.body) { set.timedSeconds = cleanSeconds(req.body.timedSeconds); }
    if (cleanSubject(req.body.subject)) { set.subject = req.body.subject; }
    if (!Object.keys(set).length) { return res.status(400).json({ error: 'nothing to update' }); }
    if (set.question === '' || set.answer === '') {
      return res.status(400).json({ error: 'question and answer cannot be empty' });
    }
    await pending.updateOne(
      { _id: new ObjectId(String(req.body.id)), status: 'pending' },
      { $set: set }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

router.post('/approve', requireAuth, async (req, res) => {
  try {
    // claim it first, so a double click cannot publish the same question twice
    const claimed = await pending.findOneAndUpdate(
      { _id: new ObjectId(String(req.body.id)), status: 'pending' },
      { $set: { status: 'approving', reviewedAt: new Date() } }
    );
    const doc = claimed && Object.prototype.hasOwnProperty.call(claimed, 'value')
      ? claimed.value
      : claimed;
    if (!doc || !doc.question) { return res.status(409).json({ error: 'already reviewed' }); }
    if (!cleanSubject(doc.subject)) {
      await pending.updateOne({ _id: doc._id }, { $set: { status: 'pending' } });
      return res.status(400).json({ error: 'unknown subject' });
    }

    const tossupId = await publishQuestion(doc);
    await pending.updateOne({ _id: doc._id }, { $set: { status: 'approved', tossupId } });
    res.json({ ok: true, tossupId: String(tossupId) });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

router.post('/reject', requireAuth, async (req, res) => {
  try {
    await pending.updateOne(
      { _id: new ObjectId(String(req.body.id)), status: 'pending' },
      { $set: { status: 'rejected', reviewedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// write your own question straight into the live collections
router.post('/add', requireAuth, async (req, res) => {
  try {
    const subject = cleanSubject(req.body.subject);
    const question = String(req.body.question ?? '').trim();
    const answer = String(req.body.answer ?? '').trim();
    if (!subject) { return res.status(400).json({ error: 'pick a subject' }); }
    if (!question || !answer) { return res.status(400).json({ error: 'question and answer are required' }); }
    const tossupId = await publishQuestion({
      subject, question, answer, timedSeconds: cleanSeconds(req.body.timedSeconds)
    });
    res.json({ ok: true, tossupId: String(tossupId) });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// how thin each subject's pool actually is, so it is obvious where to write next
router.get('/pool', requireAuth, async (req, res) => {
  const perRound = {};
  CATEGORY_BY_QUESTION.forEach(c => { perRound[c] = (perRound[c] ?? 0) + 1; });

  const pools = await Promise.all(Object.entries(SUBJECTS).map(async ([subject, triple]) => {
    const [category] = triple;
    // mirror the filters DISTRIBUTION uses, so these counts are the real pools
    let filter;
    if (subject === 'Mathematics') {
      filter = { alternate_subcategory: 'Math' };
    } else if (subject === 'World Language') {
      filter = { kshsaa_category: { $regex: 'foreign language|world language', $options: 'i' } };
    } else if (subject === 'Science/Health') {
      filter = { category: 'Science', alternate_subcategory: { $ne: 'Math' } };
    } else {
      filter = { category };
    }
    const base = { kshsaaImport: true, ...filter };
    const [all, generated] = await Promise.all([
      tossups.countDocuments(base),
      tossups.countDocuments({ ...base, 'set.name': { $regex: '^' + GENERATED_SET_PREFIX } })
    ]);
    return { subject, perRound: perRound[subject] ?? 0, all, generated };
  }));

  res.json({ pools });
});

// ---------- page ----------

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Question bank</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
 body{background:#f6f7f9;color:#1f2733;font-size:15px}
 h1{font-size:1.35rem;font-weight:600}
 h2{font-size:1.05rem;font-weight:600;color:#33415c;margin:2rem 0 .65rem}
 .card{border:1px solid #e4e8ee;border-radius:.5rem;box-shadow:none}
 .note{font-size:.83rem;color:#6b7280}
 .kshsaa-bar{background:#eef1f7;border-bottom:1px solid #d9e0ec}
 .kshsaa-bar a{color:#4a5b7d;text-decoration:none;margin:0 .85rem;font-size:.9rem}
 .kshsaa-bar a:hover{color:#1f3864;text-decoration:underline}
 .kshsaa-bar a.active{color:#1f3864;font-weight:600}
 .kshsaa-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.25rem}
 .kshsaa-nav .kshsaa-links{grid-column:2;display:flex;flex-wrap:wrap;justify-content:center;gap:.35rem 0}
 .kshsaa-home{justify-self:start;margin-left:0 !important;white-space:nowrap}
 @media (max-width:900px){
   .kshsaa-nav{grid-template-columns:1fr;justify-items:center;gap:.35rem}
   .kshsaa-nav .kshsaa-links{grid-column:1}
 }
 .qcard{border-left:3px solid #c7d2e5}
 .qcard.done{opacity:.45}
 .subj{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em;color:#4a5b7d}
 .soln{background:#f3f6fb;border-radius:.35rem;padding:.5rem .7rem;font-size:.85rem;color:#33415c;
   white-space:pre-wrap}
 table{font-size:.9rem}
 .num{text-align:right;font-variant-numeric:tabular-nums}
 .thin{color:#a4262c;font-weight:600}
</style>
</head><body>

<div class="kshsaa-bar py-2 mb-3">
  <div class="container kshsaa-nav" style="max-width:1000px">
    <a class="kshsaa-home" href="/">&larr; QBReader</a>
    <span class="kshsaa-links">
      <a href="/kshsaa-play">Read a round</a>
      <a href="/kshsaa-round">Download packet</a>
      <a href="/kshsaa-stats">Practice stats</a>
      <a href="/kshsaa-questions" class="active">Question bank</a>
      <a href="/kshsaa-spanish/">Spanish Practice</a>
    </span>
  </div>
</div>

<div class="container pb-5" style="max-width:1000px">
  <h1>Question bank</h1>

  <div id="login" class="card mt-3 d-none" style="max-width:420px"><div class="card-body">
    <label class="form-label">Team password</label>
    <input type="password" class="form-control mb-2" id="pw">
    <button class="btn btn-primary" id="loginBtn">Enter</button>
    <div class="small text-danger mt-2" id="loginErr"></div>
  </div></div>

  <div id="app" class="d-none">
    <h2 class="mt-3">Pool sizes</h2>
    <p class="note">How many questions each subject can draw on, and how many of those you have
    written. A round needs the "per round" count from each.</p>
    <div class="card"><div class="card-body p-0"><div class="table-responsive">
      <table class="table table-sm mb-0"><thead><tr>
        <th>Subject</th><th class="num">Per round</th><th class="num">Pool</th>
        <th class="num">Yours</th><th class="num">Rounds before repeats</th>
      </tr></thead><tbody id="poolBody"></tbody></table>
    </div></div></div>

    <h2>Review queue <span class="badge text-bg-secondary" id="pendingCount">0</span></h2>
    <p class="note">Approving writes the question into the live collection immediately, along with
    its stats document. Generated questions land in a <code>SJA Generated</code> set, so the round
    pages leave them out unless you tick the box for them.</p>
    <div class="mb-2">
      <button class="btn btn-sm btn-outline-success" id="approveAll">Approve everything below</button>
      <span class="ms-2 small" id="bulkMsg"></span>
    </div>
    <div id="queue"></div>

    <h2>Write your own</h2>
    <div class="card"><div class="card-body">
      <div class="row g-2">
        <div class="col-sm-4">
          <label class="form-label small fw-semibold">Subject</label>
          <select class="form-select form-select-sm" id="addSubject"></select>
        </div>
        <div class="col-sm-3">
          <label class="form-label small fw-semibold">Time limit (seconds)</label>
          <input class="form-control form-control-sm" id="addSeconds" type="number" min="1" max="600" placeholder="blank = 10s">
        </div>
      </div>
      <label class="form-label small fw-semibold mt-2">Question</label>
      <textarea class="form-control form-control-sm" id="addQuestion" rows="3"></textarea>
      <label class="form-label small fw-semibold mt-2">Answer</label>
      <input class="form-control form-control-sm" id="addAnswer">
      <button class="btn btn-primary btn-sm mt-3" id="addBtn">Add to the question bank</button>
      <span class="ms-2 small" id="addMsg"></span>
    </div></div>
  </div>
</div>

<script>
var $ = function (id) { return document.getElementById(id); };
var SUBJECTS = [];

function esc (s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function show (authed) {
  $('login').classList.toggle('d-none', authed);
  $('app').classList.toggle('d-none', !authed);
  if (authed) { loadPool(); loadQueue(); }
}
fetch('/kshsaa-stats/me').then(function (r) { return r.json(); })
  .then(function (d) { show(d.authed); })
  .catch(function () { show(false); });

$('loginBtn').onclick = function () {
  fetch('/kshsaa-stats/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: $('pw').value })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) { res.ok ? show(true) : ($('loginErr').textContent = res.d.error || 'failed'); });
};
$('pw').onkeydown = function (e) { if (e.key === 'Enter') { $('loginBtn').click(); } };

function loadPool () {
  fetch('/kshsaa-questions/pool').then(function (r) { return r.json(); }).then(function (d) {
    $('poolBody').innerHTML = (d.pools || []).map(function (p) {
      var rounds = p.perRound ? Math.floor(p.all / p.perRound) : 0;
      var thin = rounds < 100 ? ' class="thin"' : '';
      return '<tr><td>' + esc(p.subject) + '</td>' +
        '<td class="num">' + p.perRound + '</td>' +
        '<td class="num">' + p.all + '</td>' +
        '<td class="num">' + p.generated + '</td>' +
        '<td class="num"' + thin + '>' + rounds + '</td></tr>';
    }).join('');
  });
}

function loadQueue () {
  fetch('/kshsaa-questions/list?status=pending').then(function (r) { return r.json(); }).then(function (d) {
    SUBJECTS = d.subjects || [];
    $('addSubject').innerHTML = SUBJECTS.map(function (s) {
      return '<option' + (s === 'Mathematics' ? ' selected' : '') + '>' + esc(s) + '</option>';
    }).join('');
    $('pendingCount').textContent = (d.counts && d.counts.pending) || 0;

    var list = d.questions || [];
    if (!list.length) {
      $('queue').innerHTML = '<div class="card"><div class="card-body text-center py-4">' +
        '<p class="mb-1 fw-semibold">Nothing waiting for review</p>' +
        '<p class="note mb-0">' + ((d.counts && d.counts.approved) || 0) + ' approved, ' +
        ((d.counts && d.counts.rejected) || 0) + ' rejected so far.</p></div></div>';
      return;
    }
    $('queue').innerHTML = list.map(function (q) {
      return '<div class="card qcard mb-2" data-id="' + q.id + '"><div class="card-body">' +
        '<div class="d-flex justify-content-between align-items-start">' +
        '<span class="subj">' + esc(q.subject) + (q.topic ? ' &middot; ' + esc(q.topic) : '') + '</span>' +
        '<span class="small text-secondary">' + (q.timedSeconds || 10) + 's</span></div>' +
        '<textarea class="form-control form-control-sm mt-2 qq" rows="3">' + esc(q.question) + '</textarea>' +
        '<label class="form-label small fw-semibold mt-2 mb-1">Answer</label>' +
        '<input class="form-control form-control-sm qa" value="' + esc(q.answer) + '">' +
        (q.solution ? '<div class="soln mt-2"><strong>Check:</strong> ' + esc(q.solution) + '</div>' : '') +
        '<div class="mt-2">' +
        '<button class="btn btn-sm btn-success approve">Approve</button> ' +
        '<button class="btn btn-sm btn-outline-secondary reject">Reject</button> ' +
        '<span class="ms-2 small msg"></span></div>' +
        '</div></div>';
    }).join('');

    Array.prototype.forEach.call(document.querySelectorAll('.qcard'), function (card) {
      var id = card.getAttribute('data-id');
      var msg = card.querySelector('.msg');
      var finish = function (text, cls) {
        msg.innerHTML = '<span class="text-' + cls + '">' + text + '</span>';
        card.classList.add('done');
        Array.prototype.forEach.call(card.querySelectorAll('button'), function (b) { b.disabled = true; });
        $('pendingCount').textContent = Math.max(0, Number($('pendingCount').textContent) - 1);
        loadPool();
      };
      card.querySelector('.approve').onclick = function () {
        var body = {
          id: id,
          question: card.querySelector('.qq').value,
          answer: card.querySelector('.qa').value
        };
        // save any edits first, then publish
        fetch('/kshsaa-questions/update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        }).then(function () {
          return fetch('/kshsaa-questions/approve', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id })
          });
        }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            res.ok ? finish('added to the bank', 'success') : finish(esc(res.d.error || 'failed'), 'danger');
          });
      };
      card.querySelector('.reject').onclick = function () {
        fetch('/kshsaa-questions/reject', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id })
        }).then(function () { finish('rejected', 'secondary'); });
      };
    });
  });
}

$('approveAll').onclick = function () {
  var cards = [].slice.call(document.querySelectorAll('.qcard:not(.done)'));
  if (!cards.length) { $('bulkMsg').textContent = 'nothing to approve'; return; }
  if (!window.confirm('Approve all ' + cards.length + ' questions below? Each is written straight into the question bank.')) { return; }
  $('approveAll').disabled = true;
  var done = 0;
  var failed = 0;
  // sequential on purpose: each still goes through the same claim-then-publish
  // path as a single approval, so one failure stops at one question
  var step = function (i) {
    if (i >= cards.length) {
      $('bulkMsg').innerHTML = '<span class="text-success">approved ' + done + '</span>' +
        (failed ? ' <span class="text-danger">(' + failed + ' failed)</span>' : '');
      $('approveAll').disabled = false;
      loadPool();
      return;
    }
    $('bulkMsg').textContent = 'approving ' + (i + 1) + ' of ' + cards.length + '...';
    cards[i].querySelector('.approve').click();
    var waited = 0;
    var poll = setInterval(function () {
      waited += 120;
      if (cards[i].classList.contains('done') || waited > 15000) {
        clearInterval(poll);
        if (cards[i].classList.contains('done')) { done++; } else { failed++; }
        step(i + 1);
      }
    }, 120);
  };
  step(0);
};

$('addBtn').onclick = function () {
  var body = {
    subject: $('addSubject').value,
    question: $('addQuestion').value,
    answer: $('addAnswer').value,
    timedSeconds: $('addSeconds').value
  };
  fetch('/kshsaa-questions/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (res.ok) {
        $('addMsg').innerHTML = '<span class="text-success">added</span>';
        $('addQuestion').value = '';
        $('addAnswer').value = '';
        $('addSeconds').value = '';
        loadPool();
      } else {
        $('addMsg').innerHTML = '<span class="text-danger">' + esc(res.d.error || 'failed') + '</span>';
      }
    });
};
</script>
</body></html>`;

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(PAGE);
});

export default router;
