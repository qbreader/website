// Self-serve KSHSAA round generator page for your qbreader fork.
//
// INSTALL (2 steps):
//   1. Save this file as   routes/kshsaa-round.js   in your website folder.
//   2. In app.js, add these two lines (next to the other route imports/uses):
//        import kshsaaRoundRouter from './routes/kshsaa-round.js';
//        app.use('/kshsaa-round', kshsaaRoundRouter);
//
// Then anyone visits  <your-site>/kshsaa-round  , clicks a button, and gets a
// fresh randomized 16-question KSHSAA round: viewable answer key on screen and
// a MODAQ file to download. No terminal, no database access, no accounts.
//
// No `npm run build` needed - the page is plain HTML/JS served by this route.

import { Router } from 'express';
import { tossups } from '../database/qbreader/collections.js';

const router = Router();

// [label, count, filter] - official KSHSAA round shape, 16 questions
const DISTRIBUTION = [
  ['World Language', 1, { kshsaa_category: { $regex: 'foreign language|world language', $options: 'i' } }],
  ['Language Arts', 3, { category: 'Literature' }],
  ['Science/Health', 3, { category: 'Science', alternate_subcategory: { $ne: 'Math' } }],
  ['Social Studies', 3, { category: 'Social Science' }],
  ['Mathematics', 3, { alternate_subcategory: 'Math' }],
  ['Fine Arts', 2, { category: 'Fine Arts' }],
  ['Year in Review', 1, { category: 'Current Events' }]
];

/** Category label of every slot in a full round, in reading order. */
export const CATEGORY_BY_QUESTION = DISTRIBUTION.flatMap(([label, count]) => Array(count).fill(label));
/** Category labels in reading order, deduplicated. */
export const CATEGORIES = DISTRIBUTION.map(([label]) => label);

// The filters can overlap (a foreign-language question may also be tagged
// Literature), so oversample every category, run them together, and drop
// collisions afterwards. Chaining a growing $nin through seven awaits gave the
// same result one round trip at a time.
const HEADROOM = 3;

/**
 * @param {boolean} includeConverted whether to draw on the converted-quizbowl sets too
 * @param {boolean} includeGenerated whether to draw on the SJA Generated sets too
 * @returns {Promise<{round: object[], short: string[]}>} the round, plus a label
 * for each category the archive could not fill
 */
async function buildRound (includeConverted, includeGenerated) {
  // Both extra sources are opt-in, so exclude whichever was not asked for.
  const excluded = [];
  if (!includeConverted) { excluded.push('^QB Converted'); }
  if (!includeGenerated) { excluded.push('^SJA Generated'); }
  const setFilter = excluded.length
    ? { 'set.name': { $not: { $regex: excluded.join('|') } } }
    : {};

  const samples = await Promise.all(DISTRIBUTION.map(([, count, filter]) => tossups
    .aggregate([
      { $match: { kshsaaImport: true, ...filter, ...setFilter } },
      { $sample: { size: count + HEADROOM } }
    ])
    .toArray()));

  const picked = new Set();
  const round = [];
  const short = [];
  DISTRIBUTION.forEach(([label, count], i) => {
    const docs = samples[i].filter(d => !picked.has(String(d._id))).slice(0, count);
    for (const d of docs) {
      picked.add(String(d._id));
      const secs = d.timed_seconds || (label === 'Mathematics' ? 30 : null);
      round.push({
        category: label,
        question: (secs ? `[${secs} sec] ` : '') + d.question,
        answer: d.answer,
        source: `${d.set?.name ?? '?'} ${d.packet?.name ?? ''}`.trim()
      });
    }
    if (docs.length < count) short.push(`${label} (${docs.length} of ${count})`);
  });
  return { round, short };
}

router.get('/generate', async (req, res) => {
  try {
    const { round, short } = await buildRound(req.query.converted === '1', req.query.generated === '1');
    res.json({ round, short });
  } catch (e) {
    console.error('kshsaa-round error', e);
    res.status(500).json({ error: String(e) });
  }
});

const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Download a packet - SJA Scholars Bowl</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<style>
 .kshsaa-bar{background:#eef1f7;border-bottom:1px solid #d9e0ec}
 .kshsaa-bar a{color:#4a5b7d;text-decoration:none;margin:0 .85rem;font-size:.9rem}
 .kshsaa-bar a:hover{color:#1f3864;text-decoration:underline}
 .kshsaa-bar a.active{color:#1f3864;font-weight:600}
 /* three columns so the section links stay centred on the page no matter how
    wide the "back to QBReader" link on the left happens to be */
 .kshsaa-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.25rem}
 .kshsaa-nav .kshsaa-links{grid-column:2}
 .kshsaa-home{justify-self:start;margin-left:0 !important;white-space:nowrap}
 @media (max-width:575px){
   .kshsaa-nav{grid-template-columns:1fr;justify-items:center;gap:.35rem}
   .kshsaa-nav .kshsaa-links{grid-column:1}
 }
 @media print{.kshsaa-bar,.card-body .btn,.form-check{display:none}}
</style>
</head><body class="bg-light">
<div class="kshsaa-bar py-2 mb-3">
  <div class="container kshsaa-nav" style="max-width:900px">
    <a class="kshsaa-home" href="/">&larr; QBReader</a>
    <span class="kshsaa-links">
      <a href="/kshsaa-play">Read a round</a>
      <a href="/kshsaa-round" class="active">Download packet</a>
      <a href="/kshsaa-stats">Practice stats</a>
      <a href="/kshsaa-questions">Question bank</a>
    </span>
  </div>
</div>
<div class="container pb-4" style="max-width:900px">
  <h1 class="h4">Download a packet</h1>
  <p class="text-secondary">Builds a fresh, randomized 16-question round in official KSHSAA order
  (1 world language, 3 language arts, 3 science/health, 3 social studies, 3 math, 2 fine arts,
  1 year in review) drawn from the full question archive.</p>

  <div class="card mb-3"><div class="card-body">
    <div class="form-check mb-3">
      <input class="form-check-input" type="checkbox" id="conv">
      <label class="form-check-label" for="conv">
        Include converted quizbowl questions (bigger pool, slightly rougher wording)
      </label>
    </div>
    <div class="form-check mb-3">
      <input class="form-check-input" type="checkbox" id="gen">
      <label class="form-check-label" for="gen">
        Include questions written for this team (<a href="/kshsaa-questions">question bank</a>)
      </label>
    </div>
    <button class="btn btn-primary" id="go">Generate a round</button>
    <button class="btn btn-outline-secondary" id="pdf" disabled>Download PDF</button>
    <button class="btn btn-outline-secondary" id="txt" disabled>Download text</button>
    <button class="btn btn-outline-secondary" id="dl" disabled>Download for MODAQ</button>
    <button class="btn btn-outline-secondary" id="pr" disabled>Print</button>
    <span class="ms-2 text-secondary" id="status"></span>
  </div></div>

  <div id="out"></div>

  <hr>
  <p class="small text-secondary mb-1"><strong>How to run the round:</strong> download the MODAQ file, open
  <a href="https://www.quizbowlreader.com" target="_blank" rel="noopener">quizbowlreader.com</a>, start a new game,
  and load the file as the packet. Scoring per the KSHSAA manual: 10 points for a correct answer, no bonuses;
  &minus;5 only for the first team's wrong answer on an interruption (a second-team interruption miss carries no penalty).
  Teams get 10 seconds to buzz, 30&ndash;120 on computation questions as marked.</p>
</div>

<script>
// surface any script error on the page itself, so problems are visible
// without opening the browser console
window.onerror = function (msg, src, line) {
  var s = document.getElementById('status');
  if (s) s.innerHTML = '<span class="text-danger">script error: ' + msg + ' (line ' + line + ')</span>';
  return false;
};
</script>
<script>
let current = null;
const $ = id => document.getElementById(id);
document.getElementById('status').textContent = 'ready';

$('go').onclick = async () => {
  $('status').textContent = 'building...';
  $('go').disabled = true;
  try {
    const r = await fetch('/kshsaa-round/generate?converted=' + ($('conv').checked ? '1' : '0') +
      '&generated=' + ($('gen').checked ? '1' : '0'));
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    current = data.round;
    render(current);
    $('dl').disabled = false;
    $('pr').disabled = false;
    $('pdf').disabled = false;
    $('txt').disabled = false;
    if (data.short && data.short.length) {
      $('status').innerHTML = '<span class="text-warning-emphasis">' + current.length +
        ' questions - the archive ran short on ' + escapeHtml(data.short.join(', ')) + '</span>';
    } else {
      $('status').textContent = current.length + ' questions';
    }
  } catch (e) {
    $('status').textContent = 'error: ' + e.message;
  }
  $('go').disabled = false;
};

function render (round) {
  const rows = round.map((q, i) =>
    '<tr><td class="text-secondary">' + (i + 1) + '</td>' +
    '<td class="small text-nowrap text-secondary">' + q.category + '</td>' +
    '<td>' + escapeHtml(q.question) +
    '<div class="small text-success mt-1">ANSWER: ' + escapeHtml(q.answer) + '</div>' +
    '<div class="small text-secondary">' + escapeHtml(q.source) + '</div></td></tr>').join('');
  $('out').innerHTML =
    '<div class="card"><div class="card-body p-0"><div class="table-responsive">' +
    '<table class="table table-sm mb-0 align-top">' +
    '<thead><tr><th>#</th><th>Category</th><th>Question &amp; answer</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div></div></div>';
}

function escapeHtml (s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

$('dl').onclick = () => {
  const packet = { tossups: current.map(q => ({ question: q.question, answer: q.answer })), bonuses: [] };
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'KSHSAA round ' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
};

$('pr').onclick = () => window.print();

function stamp () { return new Date().toISOString().slice(0, 10); }

$('txt').onclick = () => {
  const NL = String.fromCharCode(13, 10);
  let out = 'KSHSAA PRACTICE ROUND - ' + stamp() + NL + NL;
  current.forEach((q, i) => {
    out += (i + 1) + '. [' + q.category + '] ' + q.question + NL;
    out += '   ANSWER: ' + q.answer + NL + NL;
  });
  const blob = new Blob([out], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'KSHSAA round ' + stamp() + '.txt';
  a.click();
};

$('pdf').onclick = () => {
  if (!window.jspdf) { alert('PDF library did not load - use Print and choose "Save as PDF" instead.'); return; }
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  const M = 54;
  const W = doc.internal.pageSize.getWidth() - M * 2;
  const H = doc.internal.pageSize.getHeight();
  let y = M;

  doc.setFont('helvetica', 'bold').setFontSize(14);
  doc.text('KSHSAA practice round', M, y);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  doc.text(stamp() + '   -   10 points per correct answer, -5 on a wrong interruption', M, y + 14);
  y += 36;

  current.forEach((q, i) => {
    const qLines = doc.splitTextToSize((i + 1) + '. ' + q.question, W - 10);
    const aLines = doc.splitTextToSize('ANSWER: ' + q.answer, W - 24);
    const needed = 12 + qLines.length * 13 + aLines.length * 12 + 12;
    if (y + needed > H - M) { doc.addPage(); y = M; }

    doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(110);
    doc.text(q.category.toUpperCase(), M, y);
    y += 12;

    doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(0);
    doc.text(qLines, M, y);
    y += qLines.length * 13 + 3;

    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.text(aLines, M + 14, y);
    y += aLines.length * 12 + 14;
  });

  doc.save('KSHSAA round ' + stamp() + '.pdf');
};
</script>
</body></html>`;

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(PAGE);
});

export default router;
