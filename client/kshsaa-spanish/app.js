/* global localStorage, Blob */
(() => {
  const $ = id => document.getElementById(id); const D = window.BOWL_DATA; const G = window.BOWL_GENERATOR; const B = window.BOWL_BANK;
  const storeKey = 'spanish-bowl-progress-v2'; const format = n => n.toLocaleString();
  function read (key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
  let record = read(storeKey, { rated: 0, correct: 0, words: {}, skills: {}, seen: [], flagged: [] });
  if (!record || typeof record !== 'object')record = {}; record.rated = Number(record.rated) || 0; record.correct = Number(record.correct) || 0; record.words = record.words || {}; record.skills = record.skills || {};
  let missed = read('spanish-bowl-missed-v1', []); if (!Array.isArray(missed))missed = []; missed = missed.filter(q => q && typeof q.spanish === 'string' && typeof q.english === 'string');
  let history = new Set(Array.isArray(record.seen) ? record.seen : []); let flagged = new Set(Array.isArray(record.flagged) ? record.flagged : []);
  let mode = 'mixed'; let current = null; let revealed = false; let graded = false; let tick = null; let seconds = 10; let sessionRated = 0; let sessionRight = 0; let storageProblem = false;
  const names = { present: 'Present', preterite: 'Preterite', imperfect: 'Imperfect', future: 'Future', conditional: 'Conditional', commands: 'Commands', subjunctive: 'Subjunctive', expressions: 'Useful expressions' };
  const label = x => names[x] || x;
  function skills (q) { return q.skills?.length ? q.skills : [q.grammar || 'Sentence comprehension']; }
  function ranks (q) { return [...new Set(q.ranks || q.targets?.map(t => t.rank) || G.match(q.spanish).filter(v => v.tags.some(t => ['nm', 'nf', 'adj', 'adv', 'v', 'nc', 'nm/f'].includes(t))).map(v => v.rank))]; }
  function save () { record.seen = [...history].slice(-12000); record.flagged = [...flagged]; try { localStorage.setItem(storeKey, JSON.stringify(record)); localStorage.setItem('spanish-bowl-missed-v1', JSON.stringify(missed)); storageProblem = false; } catch { storageProblem = true; } }
  function stats () { $('missed-count').textContent = missed.length; $('done').textContent = sessionRated; $('accuracy').textContent = sessionRated ? Math.round(sessionRight / sessionRated * 100) + '%' : '—'; }
  function stopClock () { clearInterval(tick); tick = null; }
  function startClock () { stopClock(); seconds = 10; $('timer').textContent = $('timed').checked ? '10s' : ''; if (!$('timed').checked || !current || revealed || mode === 'progress') return; tick = setInterval(() => { seconds--; $('timer').textContent = seconds > 0 ? seconds + 's' : 'Time • finish your answer'; if (seconds <= 0)stopClock(); }, 1000); }
  const base = Object.keys(names); const bankSkills = [...new Set(B.sentences.flatMap(q => q.skills))].sort();
  function layout () {
    document.querySelectorAll('.mode').forEach(b => { b.classList.toggle('active', b.dataset.mode === mode); b.setAttribute('aria-current', b.dataset.mode === mode ? 'page' : 'false'); }); const metadata = { mixed: ['POSTER-STYLE TRANSLATION', 'Full practice', 'Generated + sourced', 'A mix of new combinations and sourced sentences. Answer aloud or type, then compare meaning—not exact wording.'], generated: ['BUILD FLEXIBLE COMPREHENSION', 'New combinations', '22 grammar families', 'Fresh combinations across tenses, pronouns, comparisons, duration, and more. These are finite variations, not live AI output.'], bank: ['WORDS IN CONTEXT', 'Sentence bank', format(B.sentences.length) + ' pairs', 'Sourced Spanish–English examples selected for breadth. Filtered and spot-checked, not individually certified. Flag a questionable translation.'], archive: ['YOUR QUESTION SETS', 'Tournament archive', D.archive.length + ' prompts', 'Historical tournament wording. Original answer notes and other languages appear after you reveal the answer.'], vocab: ['SPANISH TOP 5000', 'Anki vocabulary', '5,000 entries', 'Vocabulary definitions from your deck. Use sentence practice to test those words in context.'], review: ['REVISIT WHAT YOU MISSED', 'Missed items', missed.length + ' queued', 'Retry the items marked Needs practice. Got it removes an item from the queue.'], progress: ['PRACTICE, NOT A MASTERY CLAIM', 'Your progress', format(record.rated) + ' rated', 'Progress is saved on this device. Word exposure and whole-sentence self-ratings are tracked separately from grammar.'] }[mode]; $('mode-kicker').textContent = metadata[0]; $('mode-title').textContent = metadata[1]; $('pool').textContent = metadata[2]; $('mode-note').textContent = metadata[3]; $('exercise').hidden = mode === 'progress'; $('progress-panel').hidden = mode !== 'progress'; $('generation-settings').hidden = ['vocab', 'review', 'progress'].includes(mode); $('vocab-settings').hidden = ['archive', 'review', 'progress'].includes(mode); $('length-settings').hidden = ['vocab', 'review', 'progress'].includes(mode); $('rank-note').hidden = mode === 'vocab'; $('poster-toggle').disabled = mode === 'progress';
    const opts = mode === 'bank' ? bankSkills : mode === 'archive' ? [...new Set(D.archive.flatMap(skills))].sort() : [...base, ...G.families]; const old = $('grammar').value; $('grammar').replaceChildren(); for (const v of ['mixed', ...new Set(opts)]) { const o = document.createElement('option'); o.value = v; o.textContent = v === 'mixed' ? 'All grammar' : label(v); $('grammar').append(o); }$('grammar').value = opts.includes(old) ? old : 'mixed';
  }
  function eligible (pool, useRank = true) { const rank = Number($('rank').value); const limit = Number($('length').value); const focus = $('grammar').value; return pool.filter(q => !flagged.has(q.spanish) && (!useRank || ranks(q).some(r => r <= rank)) && (q.words || q.spanish.split(/\s+/).length) <= limit && (focus === 'mixed' || skills(q).includes(focus))); }
  function choose (pool) {
    if (!pool.length) return null; let p = pool.filter(q => !history.has(q.spanish)); if (!p.length) { for (const q of pool)history.delete(q.spanish); p = pool; } // Repeat only after eligible bank is exhausted.
    // Sample a small candidate set, with a mild preference for less-practiced or missed skills.
    const candidates = Array.from({ length: Math.min(12, p.length) }, () => p[Math.floor(Math.random() * p.length)]); const weight = q => 1 + skills(q).reduce((n, s) => { const r = record.skills[s]; return n + (r ? 2 * (r.miss || 0) / (r.seen || 1) : 1); }, 0) / skills(q).length; const sum = candidates.reduce((s, q) => s + weight(q), 0); let x = Math.random() * sum; for (const q of candidates) { x -= weight(q); if (x <= 0) return q; } return candidates[0];
  }
  function generated () { const focus = $('grammar').value; const rank = Number($('rank').value); const limit = Number($('length').value); let q; let fallback = null; for (let i = 0; i < 160; i++) { q = G.generate(rank, focus); if (q && !flagged.has(q.spanish) && q.words <= limit) { fallback = q; if (!history.has(q.spanish)) return q; } } if (fallback)fallback.repeated = true; return fallback; }
  function next () {
    stopClock(); layout(); if (mode === 'progress') { renderProgress(); return; } const bankPool = ['mixed', 'bank'].includes(mode) ? eligible(B.sentences) : []; if (mode === 'generated')current = generated(); else if (mode === 'mixed') { const genFirst = Math.random() < 0.55; current = genFirst ? generated() : choose(bankPool); if (!current)current = genFirst ? choose(bankPool) : generated(); } else if (mode === 'bank')current = choose(bankPool); else if (mode === 'archive')current = choose(eligible(D.archive, false)); else if (mode === 'vocab')current = choose(D.vocab.filter(v => v.rank <= Number($('rank').value)).map(v => ({ id: 'v' + v.rank, spanish: v.lemma, english: v.english, source: 'Anki · rank ' + format(v.rank), origin: 'vocab', ranks: [v.rank], skills: ['Vocabulary recall'] })).filter(q => !flagged.has(q.spanish))); else current = choose(missed.filter(q => !flagged.has(q.spanish)));
    revealed = false; graded = false; $('response').value = ''; $('answer-panel').hidden = true; $('reveal').hidden = false; $('flag').hidden = true; $('status').textContent = ''; $('timer').textContent = ''; $('answer').textContent = ''; $('targets').replaceChildren(); $('reveal').disabled = !current; $('skip').disabled = !current; $('response').disabled = !current; if (!current) { $('prompt').textContent = mode === 'review' ? 'Nothing to review yet.' : 'No unseen cards match these settings.'; $('source').textContent = mode === 'review' ? 'Mark a question Needs practice to add it here.' : 'Try All grammar, more words, or a longer sentence limit.'; $('origin-badge').textContent = ''; return; }
    history.add(current.spanish); save(); if (current.repeated)$('status').textContent = 'Revisiting a combination: this focused set is finite.'; $('kind').textContent = current.origin === 'vocab' ? 'Give the English meaning' : 'Translate into English'; $('prompt').textContent = current.spanish; $('source').textContent = current.source || 'Saved practice'; $('origin-badge').textContent = { bank: 'Sourced sentence', generated: 'Generated', archive: 'Tournament archive', vocab: 'Vocabulary' }[current.origin] || 'Review'; startClock();
  }
  function reveal () {
    if (!current || revealed) return; revealed = true; stopClock(); $('answer-panel').hidden = false; $('reveal').hidden = true; $('flag').hidden = false; $('answer').textContent = current.english; $('answer-note').textContent = current.note || ''; $('status').textContent = storageProblem ? 'Device storage is unavailable. Progress will last only for this session.' : ''; $('targets').replaceChildren(); for (const r of ranks(current)) { const v = G.vocabByRank.get(r); if (!v) continue; const t = document.createElement('span'); t.className = 'target'; t.textContent = `${v.lemma} · #${format(v.rank)}`; $('targets').append(t); }$('attribution').replaceChildren(); if (current.origin === 'bank') { const p = document.createElement('span'); p.textContent = 'Source: Tatoeba contributors / ManyThings, May 2018 · CC BY 2.0. '; $('attribution').append(p); const a = document.createElement('a'); a.href = 'tatoeba-about.txt'; a.target = '_blank'; a.textContent = 'Collection credits'; $('attribution').append(a); if (current.alternatives?.length > 1) { const alt = document.createElement('p'); alt.textContent = 'Other source translations: ' + current.alternatives.slice(1, 4).join(' / '); $('attribution').append(alt); } }
    $('archive-details').hidden = !current.original; $('archive-details').open = false; if (current.original) { $('original-key').textContent = 'Original key: ' + current.original; $('french').textContent = 'French: ' + (current.french || 'Not available'); $('german').textContent = 'German: ' + (current.german || 'Not available'); }$('correct').focus();
  }
  function grade (ok) { if (!current || !revealed || graded) return; graded = true; sessionRated++; record.rated++; if (ok) { sessionRight++; record.correct++; } const key = q => q.spanish; if (!ok && !missed.some(q => key(q) === key(current)))missed.push(current); if (ok)missed = missed.filter(q => key(q) !== key(current)); for (const r of ranks(current)) { const w = record.words[r] || (record.words[r] = { seen: 0, correct: 0 }); w.seen++; if (ok)w.correct++; } for (const s of skills(current)) { const p = record.skills[s] || (record.skills[s] = { seen: 0, correct: 0, miss: 0 }); p.seen++; if (ok)p.correct++; else p.miss++; }save(); stats(); next(); }
  function table (headers, rows) { const t = document.createElement('table'); const head = document.createElement('thead'); const hr = document.createElement('tr'); for (const h of headers) { const c = document.createElement('th'); c.textContent = h; hr.append(c); }head.append(hr); t.append(head); const body = document.createElement('tbody'); for (const row of rows) { const tr = document.createElement('tr'); for (const value of row) { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }body.append(tr); }t.append(body); return t; }
  function renderProgress () {
    $('progress-summary').replaceChildren(); for (const [n, l] of [[record.rated, 'sentences / words rated'], [Object.keys(record.words).length, 'deck words encountered'], [Object.keys(record.skills).length, 'skills practiced'], [missed.length, 'items to revisit']]) { const div = document.createElement('div'); const strong = document.createElement('strong'); const span = document.createElement('span'); strong.textContent = format(n); span.textContent = l; div.append(strong, span); $('progress-summary').append(div); }
    const rows = Object.entries(record.skills).sort((a, b) => (a[1].correct / a[1].seen) - (b[1].correct / b[1].seen)).map(([s, r]) => [label(s), r.seen, r.miss, Math.round(r.correct / r.seen * 100) + '%']); $('grammar-progress').replaceChildren(); $('word-progress').replaceChildren(); if (!rows.length) { $('grammar-progress').textContent = 'Rate a few cards to start tracking your practice.'; return; }$('grammar-progress').append(table(['Skill', 'Rated', 'Needs practice', 'Self-rated correct'], rows)); const words = Object.entries(record.words).map(([rank, r]) => [G.vocabByRank.get(Number(rank)), r]).filter(([v]) => v).sort((a, b) => (a[1].correct / a[1].seen) - (b[1].correct / b[1].seen) || a[0].rank - b[0].rank).map(([v, r]) => [v.lemma, '#' + v.rank, r.seen, r.correct]); $('word-progress').append(table(['Word', 'Deck rank', 'Rated contexts', 'Correct contexts'], words));
  }

  function exportProgress () {
    save();
    const blob = new Blob([JSON.stringify({ format: 'spanish-bowl-backup', version: 1, record, missed })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spanish-bowl-progress.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Validate an imported backup before replacing any saved progress.
  function validateBackup (data) {
    const count = n => Number.isSafeInteger(n) && n >= 0;
    const obj = v => v && typeof v === 'object' && !Array.isArray(v);
    const strings = v => Array.isArray(v) && v.length <= 100000 && v.every(s => typeof s === 'string' && s.length <= 10000);
    const r = data?.record;
    if (data?.format !== 'spanish-bowl-backup' || data.version !== 1 || !obj(r) ||
      !count(r.rated) || !count(r.correct) || r.correct > r.rated ||
      !obj(r.words) || !obj(r.skills) || !strings(r.seen) || !strings(r.flagged) ||
      !Array.isArray(data.missed) || data.missed.length > 20000) throw new Error('Invalid Spanish Bowl backup.');
    for (const [key, value] of [...Object.entries(r.words), ...Object.entries(r.skills)]) {
      if (['__proto__', 'constructor', 'prototype'].includes(key) || !obj(value) ||
        !count(value.seen) || !count(value.correct) || value.correct > value.seen ||
        (value.miss !== undefined && !count(value.miss))) throw new Error('Invalid progress counters.');
    }
    for (const q of data.missed) {
      if (!obj(q) || typeof q.spanish !== 'string' || typeof q.english !== 'string' ||
        q.spanish.length > 10000 || q.english.length > 10000 ||
        (q.skills !== undefined && !strings(q.skills)) ||
        (q.ranks !== undefined && (!Array.isArray(q.ranks) || !q.ranks.every(n => count(n) && n <= 5000)))) throw new Error('Invalid review card.');
    }
    // Copy only supported card fields; all imported strings are displayed as text.
    const cards = data.missed.map(q => {
      const card = { spanish: q.spanish, english: q.english };
      for (const key of ['id', 'source', 'origin', 'grammar', 'note', 'original', 'french', 'german']) {
        if (typeof q[key] === 'string') card[key] = q[key];
      }
      if (q.skills) card.skills = q.skills;
      if (q.ranks) card.ranks = q.ranks;
      return card;
    });
    return { record: { rated: r.rated, correct: r.correct, words: r.words, skills: r.skills, seen: r.seen, flagged: r.flagged }, missed: cards };
  }

  async function importProgress (file) {
    if (!file) return;
    const status = $('transfer-status');
    try {
      if (file.size > 20000000) throw new Error('Backup is too large (20 MB maximum).');
      const backup = validateBackup(JSON.parse(await file.text()));
      if (!window.confirm('Replace Spanish practice progress on this website with this backup? Export your current progress first if you want to keep it.')) return;
      record = backup.record;
      missed = backup.missed;
      history = new Set(record.seen);
      flagged = new Set(record.flagged);
      sessionRated = 0;
      sessionRight = 0;
      save();
      stats();
      next();
      status.textContent = storageProblem ? 'Imported for this session, but browser storage is unavailable.' : 'Progress imported.';
    } catch (error) {
      status.textContent = error.message || 'Could not import this backup.';
    } finally {
      $('progress-file').value = '';
    }
  }
  $('export-progress').addEventListener('click', exportProgress);
  $('import-progress').addEventListener('click', () => $('progress-file').click());
  $('progress-file').addEventListener('change', e => importProgress(e.target.files[0]));

  document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; if (mode === 'progress') { document.body.classList.remove('poster'); $('poster-toggle').textContent = 'Poster view'; $('poster-toggle').setAttribute('aria-pressed', 'false'); }next(); })); for (const id of ['grammar', 'rank', 'length'])$(id).addEventListener('change', next); $('timed').addEventListener('change', startClock); $('reveal').addEventListener('click', reveal); $('skip').addEventListener('click', next); $('miss').addEventListener('click', () => grade(false)); $('correct').addEventListener('click', () => grade(true)); $('poster-toggle').addEventListener('click', () => { const on = document.body.classList.toggle('poster'); $('poster-toggle').textContent = on ? 'Exit poster view' : 'Poster view'; $('poster-toggle').setAttribute('aria-pressed', String(on)); }); $('flag').addEventListener('click', () => { if (!current) return; flagged.add(current.spanish); missed = missed.filter(q => q.spanish !== current.spanish); save(); stats(); next(); $('status').textContent = 'That card is excluded on this device. No report was sent.'; }); document.addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey) return; const editing = ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName); if (e.key === 'Escape' && document.body.classList.contains('poster'))$('poster-toggle').click(); if (e.key === 'Enter' && !e.shiftKey && document.activeElement === $('response')) { e.preventDefault(); reveal(); } else if (!editing && revealed && ['1', '2'].includes(e.key)) { e.preventDefault(); grade(e.key === '2'); } else if (!editing && !revealed && e.code === 'Space' && mode !== 'progress' && document.activeElement.tagName !== 'BUTTON') { e.preventDefault(); reveal(); } }); $('coverage').textContent = `Loaded: ${format(D.vocab.length)} deck entries, ${D.archive.length} archive prompts, and ${format(B.sentences.length)} sourced sentence pairs. The full bank contains exact matches to ${format(B.coverage.length)} deck entries; filters reduce this coverage. Generated practice includes 14 new structure families plus the original 8 grammar groups. These counts describe available material, not mastery.`; stats(); next();
})();
