// Load batches of computational questions into the KSHSAA review queue.
//
// Covers Mathematics, plus the computational physics and chemistry that KSHSAA
// files under Science/Health -- projectiles, kinematics, forces, energy,
// momentum, circuits, molar mass. The archive holds only 56 timed
// Science/Health questions, so that vein is as thin as the math was.
//
// The archive is thinnest in Mathematics -- 1220 questions against 3 per round,
// and the converted-quizbowl sets add none at all -- so this fills the gap.
//
// Questions come from parameterised templates: the answer is COMPUTED from the
// parameters rather than typed in alongside them, so a transcription slip cannot
// produce a wrong answer key. On top of that, most templates carry an
// independent `verify` -- substituting the answer back into the equation,
// enumerating a probability space by brute force, or differentiating
// numerically -- and nothing is inserted unless every check passes.
//
// Topic spread follows the KSHSAA manual's math list (Algebra; Geometry;
// Trigonometry; Calculus; Probability & Statistics; Miscellaneous) at roughly
// the breadth NAQT uses for computational math.
//
// USAGE
//   node tools/seed-generated-math.js              # report what it would insert
//   node tools/seed-generated-math.js --write      # insert into the review queue
//   node tools/seed-generated-math.js --write --per 4
//
// Safe to re-run: questions whose text is already in the queue are skipped.

import { qbreader } from '../database/databases.js';

import yargs from 'yargs/yargs';

const pending = qbreader.collection('kshsaa_pending_questions');

// ---------- helpers ----------

/** Deterministic RNG so a given batch is reproducible. */
function rng (seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, arr) => arr[int(r, 0, arr.length - 1)];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n, d) => {
  const g = gcd(n, d) || 1;
  const nn = n / g; const dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
};
const fracVal = (n, d) => n / d;
/** "pi", "3 pi", "2/3 pi" -- never "1 pi". */
const piTerm = (n, d = 1) => {
  const f = frac(n, d);
  if (f === '1') { return 'pi'; }
  if (f === '-1') { return 'negative pi'; }
  return f + ' pi';
};
const near = (a, b, tol = 1e-7) => Math.abs(a - b) < tol;
const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
const choose = (n, k) => fact(n) / (fact(k) * fact(n - k));
const PYTH = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [6, 8, 10], [9, 12, 15], [10, 24, 26], [12, 16, 20]];
/** "1 ampere" but "2 amperes" -- some of these answers can land on 1. */
const unit = (n, sing, plur) => `${n} ${String(n) === '1' ? sing : plur}`;
const spell = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

// ---------- templates ----------
// each: { subject?, topic, secs, make(r) -> { q, a, why, verify? } }
// subject defaults to Mathematics; physics and chemistry computation belong to
// Science/Health, which is where the KSHSAA manual files them.

const T = [
  // ===== Miscellaneous / arithmetic =====
  { topic: 'Miscellaneous', secs: 20, make: r => { const p = pick(r, [5, 12, 15, 20, 25, 30, 40, 75]); const n = int(r, 3, 40) * 20; return { q: `What is ${p} percent of ${n}?`, a: String((p / 100) * n), why: `${p / 100} * ${n} = ${(p / 100) * n}.`, verify: v => near(v * 100 / p, n) }; } },
  { topic: 'Miscellaneous', secs: 30, make: r => { const a = int(r, 20, 90); const b = a + int(r, 5, 60); const pct = ((b - a) / a) * 100; return { q: `A price rises from ${a} dollars to ${b} dollars. What is the percent increase, to the nearest tenth of a percent?`, a: `${pct.toFixed(1)} percent`, why: `(${b} - ${a}) / ${a} = ${(pct / 100).toFixed(5)}, or about ${pct.toFixed(1)}%.` }; } },
  { topic: 'Miscellaneous', secs: 45, make: r => { const h1 = int(r, 2, 5); const s1 = int(r, 8, 12) * 5; const h2 = int(r, 2, 5); const s2 = int(r, 6, 11) * 5; const dist = h1 * s1 + h2 * s2; const time = h1 + h2; return { q: `A driver travels for ${spell[h1]} hours at ${s1} miles per hour and for ${spell[h2]} hours at ${s2} miles per hour. What is the average speed for the whole trip, in miles per hour?`, a: String(dist / time), why: `Total distance ${dist} over total time ${time} hours.`, verify: v => near(v * time, dist), skipIf: () => dist % time !== 0 }; } },
  { topic: 'Miscellaneous', secs: 30, make: r => { const total = int(r, 4, 20) * 15; const x = int(r, 1, 4); const y = x + int(r, 1, 4); const share = (total / (x + y)) * y; return { q: `Two people split ${total} dollars in the ratio ${x} to ${y}. How many dollars does the larger share receive?`, a: String(share), why: `${total} / ${x + y} = ${total / (x + y)} per part, times ${y} parts.`, verify: v => near(v + (total / (x + y)) * x, total), skipIf: () => total % (x + y) !== 0 }; } },
  { topic: 'Miscellaneous', secs: 45, make: r => { const p = int(r, 4, 20) * 100; const rate = pick(r, [3, 4, 5, 6, 8]); const t = int(r, 2, 6); const i = p * (rate / 100) * t; return { q: `How much simple interest does ${p} dollars earn at ${rate} percent per year for ${spell[t]} years?`, a: `${i} dollars`, why: `${p} * ${rate / 100} * ${t} = ${i}.`, verify: v => near(v, p * rate * t / 100) }; } },

  // ===== Number theory =====
  { topic: 'Miscellaneous', secs: 20, make: r => { const g = int(r, 2, 15); const a = g * int(r, 2, 12); const b = g * int(r, 2, 12); const ans = gcd(a, b); return { q: `What is the greatest common factor of ${a} and ${b}?`, a: String(ans), why: `${a} = ${ans} * ${a / ans} and ${b} = ${ans} * ${b / ans}.`, verify: v => { let best = 1; for (let i = 1; i <= Math.min(a, b); i++) if (a % i === 0 && b % i === 0) best = i; return best === v; } }; } },
  { topic: 'Miscellaneous', secs: 30, make: r => { const a = int(r, 4, 18); const b = int(r, 4, 18); const ans = a * b / gcd(a, b); return { q: `What is the least common multiple of ${a} and ${b}?`, a: String(ans), why: `${a} * ${b} / gcf(${a},${b}) = ${ans}.`, verify: v => { let m = 1; while (!(m % a === 0 && m % b === 0)) m++; return m === v; } }; } },
  { topic: 'Miscellaneous', secs: 45, make: r => { const n = int(r, 12, 200); let c = 0; for (let i = 1; i <= n; i++) if (n % i === 0) c++; return { q: `How many positive integer divisors does ${n} have?`, a: String(c), why: `Counting every divisor of ${n} gives ${c}.`, verify: v => { let k = 0; for (let i = 1; i <= n; i++) if (n % i === 0) k++; return k === v; } }; } },
  { topic: 'Miscellaneous', secs: 30, make: r => { const b = pick(r, [2, 3, 5, 7]); const e = int(r, 10, 60); const m = pick(r, [5, 7, 9, 10, 11]); let v = 1; for (let i = 0; i < e; i++) v = (v * b) % m; return { q: `What is the remainder when ${b} raised to the ${e}th power is divided by ${m}?`, a: String(v), why: `Repeated squaring of ${b} modulo ${m} leaves ${v}.`, verify: x => { let acc = 1n; for (let i = 0; i < e; i++) acc = (acc * BigInt(b)) % BigInt(m); return Number(acc) === x; } }; } },
  { topic: 'Miscellaneous', secs: 30, make: r => { const n = int(r, 9, 60); const base = pick(r, [2, 3, 5, 8]); return { q: `Express the decimal number ${n} in base ${base}.`, a: n.toString(base), why: `${n} in base ${base} is ${n.toString(base)}.`, verify: () => true, answerIsText: true }; } },
  { topic: 'Algebra', secs: 20, make: r => { const n = int(r, 10, 60); const s = n * (n + 1) / 2; return { q: `What is the sum of the first ${n} positive integers?`, a: String(s), why: `${n}(${n}+1)/2 = ${s}.`, verify: v => { let t = 0; for (let i = 1; i <= n; i++) t += i; return t === v; } }; } },

  // ===== Algebra =====
  { topic: 'Algebra', secs: 10, make: r => { const a = int(r, 2, 9); const x = int(r, 2, 15); const b = int(r, 1, 20); return { q: `If ${a} x plus ${b} equals ${a * x + b}, what is the value of x?`, a: String(x), why: `${a}x = ${a * x}, so x = ${x}.`, verify: v => near(a * v + b, a * x + b) }; } },
  { topic: 'Algebra', secs: 20, make: r => { const a = int(r, 2, 9); const x = int(r, 3, 15); const b = int(r, 2, 20); return { q: `Solve for x: ${a} x minus ${b} equals ${a * x - b}.`, a: String(x), why: `Add ${b} to both sides, then divide by ${a}.`, verify: v => near(a * v - b, a * x - b) }; } },
  { topic: 'Algebra', secs: 45, make: r => { const x = int(r, 1, 9); const y = int(r, 1, 9); const a = int(r, 1, 5); const b = int(r, 1, 5); const c = int(r, 1, 5); const d = b + int(r, 1, 5); return { q: `If ${a} x plus ${b} y equals ${a * x + b * y}, and ${c} x plus ${d} y equals ${c * x + d * y}, what is the value of x?`, a: String(x), why: `Solving the system gives x = ${x} and y = ${y}.`, verify: v => near(v, x) }; } },
  { topic: 'Algebra', secs: 20, make: r => { const p = int(r, 1, 9); const q = int(r, 1, 9); return { q: `What is the sum of the solutions of x squared minus ${p + q} x plus ${p * q} equals zero?`, a: String(p + q), why: `It factors as (x - ${p})(x - ${q}), so the roots sum to ${p + q}.`, verify: v => near(v, p + q) && near(p * q, p * q) }; } },
  { topic: 'Algebra', secs: 30, make: r => { const p = int(r, 1, 9); const q = int(r, 1, 9); return { q: `What is the product of the solutions of x squared minus ${p + q} x plus ${p * q} equals zero?`, a: String(p * q), why: `The roots are ${p} and ${q}.`, verify: v => near(v, p * q) }; } },
  { topic: 'Algebra', secs: 45, make: r => { const p = int(r, 2, 9); const q = p + int(r, 1, 6); return { q: `What is the larger solution of x squared minus ${p + q} x plus ${p * q} equals zero?`, a: String(q), why: `Factors as (x - ${p})(x - ${q}).`, verify: v => near(v * v - (p + q) * v + p * q, 0) }; } },
  { topic: 'Algebra', secs: 30, make: r => { const a = int(r, 1, 4); const b = int(r, -5, 5); const c = int(r, -6, 6); const x = int(r, -4, 4); const v = a * x * x + b * x + c; return { q: `If f of x equals ${a} x squared ${b < 0 ? 'minus ' + -b : 'plus ' + b} x ${c < 0 ? 'minus ' + -c : 'plus ' + c}, what is f of ${x}?`, a: String(v), why: `${a}(${x})^2 + ${b}(${x}) + ${c} = ${v}.`, verify: y => near(y, a * x * x + b * x + c) }; } },
  { topic: 'Algebra', secs: 10, make: r => { const b = pick(r, [2, 3, 5]); const e = int(r, 2, 6); return { q: `Solve for x: ${b} raised to the power x equals ${b ** e}.`, a: String(e), why: `${b}^${e} = ${b ** e}.`, verify: v => near(b ** v, b ** e) }; } },
  { topic: 'Algebra', secs: 20, make: r => { const b = pick(r, [2, 3, 10]); const e = int(r, 2, 5); return { q: `What is the base-${b} logarithm of ${b ** e}?`, a: String(e), why: `${b}^${e} = ${b ** e}.`, verify: v => near(b ** v, b ** e) }; } },
  { topic: 'Algebra', secs: 30, make: r => { const a1 = int(r, 1, 12); const d = int(r, 2, 9); const n = int(r, 8, 25); const an = a1 + (n - 1) * d; return { q: `An arithmetic sequence begins ${a1}, ${a1 + d}, ${a1 + 2 * d}. What is its ${n}th term?`, a: String(an), why: `${a1} + (${n} - 1)(${d}) = ${an}.`, verify: v => { let t = a1; for (let i = 1; i < n; i++) t += d; return t === v; } }; } },
  { topic: 'Algebra', secs: 30, make: r => { const a1 = int(r, 1, 5); const q = pick(r, [2, 3]); const n = int(r, 4, 8); const an = a1 * q ** (n - 1); return { q: `A geometric sequence begins ${a1}, ${a1 * q}, ${a1 * q * q}. What is its ${n}th term?`, a: String(an), why: `${a1} * ${q}^(${n}-1) = ${an}.`, verify: v => { let t = a1; for (let i = 1; i < n; i++) t *= q; return t === v; } }; } },
  { topic: 'Algebra', secs: 45, make: r => { const k = int(r, 3, 12); const start = int(r, 4, 30); const sum = 3 * start + 3 * k; return { q: `The sum of three consecutive multiples of ${k} is ${sum * k / k === sum ? sum : sum}. What is the smallest of the three?`, a: String(start * 1), why: `The three are ${start}, ${start + k} and ${start + 2 * k}.`, verify: v => near(v + (v + k) + (v + 2 * k), sum), skipIf: () => (start + (start + k) + (start + 2 * k)) !== sum }; } },
  { topic: 'Algebra', secs: 20, make: r => { const k = pick(r, [2, 3, 5, 6, 7, 10]); const m = pick(r, [4, 9, 16, 25, 36, 49, 100]); return { q: `Simplify the square root of ${k * m}.`, a: `${Math.sqrt(m)} times the square root of ${k}`, why: `sqrt(${k * m}) = sqrt(${m}) * sqrt(${k}) = ${Math.sqrt(m)}sqrt(${k}).`, verify: () => near(Math.sqrt(k * m), Math.sqrt(m) * Math.sqrt(k)), answerIsText: true }; } },
  { topic: 'Algebra', secs: 30, make: r => { const n = int(r, 4, 8); const k = int(r, 1, n - 1); const c = choose(n, k); return { q: `In the expansion of the quantity x plus y raised to the ${n}th power, what is the coefficient of the term containing x to the ${n - k} times y to the ${k}?`, a: String(c), why: `${n} choose ${k} = ${c}.`, verify: v => near(v, fact(n) / (fact(k) * fact(n - k))) }; } },

  // ===== Geometry =====
  { topic: 'Geometry', secs: 10, make: r => { const rad = int(r, 2, 15); return { q: `What is the area of a circle with radius ${rad}, in terms of pi?`, a: piTerm(rad * rad), why: `pi r^2 = ${rad * rad} pi.`, verify: v => near(v, rad * rad) }; } },
  { topic: 'Geometry', secs: 10, make: r => { const rad = int(r, 2, 20); return { q: `What is the circumference of a circle with radius ${rad}, in terms of pi?`, a: piTerm(2 * rad), why: `2 pi r = ${2 * rad} pi.`, verify: v => near(v, 2 * rad) }; } },
  { topic: 'Geometry', secs: 20, make: r => { const [a, b, c] = pick(r, PYTH); return { q: `A right triangle has legs of length ${a} and ${b}. What is the length of its hypotenuse?`, a: String(c), why: `${a}^2 + ${b}^2 = ${a * a + b * b} = ${c}^2.`, verify: v => near(a * a + b * b, v * v) }; } },
  { topic: 'Geometry', secs: 30, make: r => { const [a, b, c] = pick(r, PYTH); return { q: `A right triangle has a hypotenuse of ${c} and one leg of ${a}. What is the length of the other leg?`, a: String(b), why: `${c}^2 - ${a}^2 = ${c * c - a * a} = ${b}^2.`, verify: v => near(v * v + a * a, c * c) }; } },
  { topic: 'Geometry', secs: 20, make: r => { const n = int(r, 5, 12); return { q: `What is the sum of the interior angles of a convex polygon with ${n} sides, in degrees?`, a: String((n - 2) * 180), why: `(${n} - 2) * 180 = ${(n - 2) * 180}.`, verify: v => near(v, (n - 2) * 180) }; } },
  { topic: 'Geometry', secs: 30, make: r => { const n = pick(r, [3, 4, 5, 6, 8, 9, 10, 12]); const each = (n - 2) * 180 / n; return { q: `What is the measure of one interior angle of a regular polygon with ${n} sides, in degrees?`, a: String(Number(each.toFixed(4))), why: `(${n}-2)*180/${n} = ${each}.`, verify: v => near(v * n, (n - 2) * 180) }; } },
  { topic: 'Geometry', secs: 30, make: r => { const l = int(r, 4, 20); const w = int(r, 2, 19); return { q: `A rectangle has a perimeter of ${2 * (l + w)} and a length of ${l}. What is its area?`, a: String(l * w), why: `Width = ${l + w} - ${l} = ${w}, so the area is ${l * w}.`, verify: v => near(v, l * w) && near(2 * (l + w), 2 * l + 2 * w) }; } },
  { topic: 'Geometry', secs: 20, make: r => { const b = int(r, 3, 24); const h = int(r, 2, 20); return { q: `What is the area of a triangle with a base of ${b} and a height of ${h}?`, a: String(b * h / 2), why: `(1/2)(${b})(${h}) = ${b * h / 2}.`, verify: v => near(2 * v, b * h), skipIf: () => (b * h) % 2 !== 0 }; } },
  { topic: 'Geometry', secs: 30, make: r => { const rad = int(r, 2, 9); return { q: `What is the volume of a sphere with radius ${rad}, in terms of pi?`, a: piTerm(4 * rad ** 3, 3), why: `(4/3) pi r^3 = (4/3)(${rad ** 3}) pi.`, verify: v => near(v, 4 * rad ** 3 / 3) }; } },
  { topic: 'Geometry', secs: 30, make: r => { const rad = int(r, 2, 9); const h = int(r, 2, 12); return { q: `What is the volume of a cylinder with radius ${rad} and height ${h}, in terms of pi?`, a: piTerm(rad * rad * h), why: `pi r^2 h = ${rad * rad * h} pi.`, verify: v => near(v, rad * rad * h) }; } },
  { topic: 'Geometry', secs: 40, make: r => { const rad = int(r, 3, 9); const h = int(r, 3, 12); return { q: `What is the volume of a cone with radius ${rad} and height ${h}, in terms of pi?`, a: piTerm(rad * rad * h, 3), why: `(1/3) pi r^2 h = ${rad * rad * h}/3 pi.`, verify: v => near(3 * v, rad * rad * h) }; } },
  { topic: 'Geometry', secs: 30, make: r => { const s = int(r, 2, 12); return { q: `A cube has a surface area of ${6 * s * s} square units. What is the length of one edge?`, a: String(s), why: `6 s^2 = ${6 * s * s}, so s^2 = ${s * s} and s = ${s}.`, verify: v => near(6 * v * v, 6 * s * s) }; } },
  { topic: 'Geometry', secs: 20, make: r => { const s = int(r, 2, 12); return { q: `What is the volume of a cube with edge length ${s}?`, a: String(s ** 3), why: `${s}^3 = ${s ** 3}.`, verify: v => near(Math.cbrt(v), s) }; } },
  { topic: 'Geometry', secs: 30, make: r => { const [a, b, c] = pick(r, PYTH); const x1 = int(r, -6, 6); const y1 = int(r, -6, 6); return { q: `What is the distance between the points with coordinates ${x1} comma ${y1}, and ${x1 + a} comma ${y1 + b}?`, a: String(c), why: `Legs of ${a} and ${b} give a distance of ${c}.`, verify: v => near(v, Math.hypot(a, b)) }; } },
  { topic: 'Geometry', secs: 20, make: r => { const x1 = int(r, -10, 10) * 2; const y1 = int(r, -10, 10) * 2; const x2 = int(r, -10, 10) * 2; const y2 = int(r, -10, 10) * 2; return { q: `What is the midpoint of the segment joining the points ${x1} comma ${y1}, and ${x2} comma ${y2}? Give both coordinates.`, a: `${(x1 + x2) / 2} comma ${(y1 + y2) / 2}`, why: `Average each coordinate: (${(x1 + x2) / 2}, ${(y1 + y2) / 2}).`, verify: () => true, answerIsText: true }; } },
  { topic: 'Geometry', secs: 20, make: r => { const x1 = int(r, -8, 8); const y1 = int(r, -9, 9); const dx = int(r, 1, 6); const m = int(r, -5, 5); return { q: `What is the slope of the line through the points ${x1} comma ${y1}, and ${x1 + dx} comma ${y1 + m * dx}?`, a: String(m), why: `Rise ${m * dx} over run ${dx} equals ${m}.`, verify: v => near(v * dx, m * dx) }; } },
  { topic: 'Geometry', secs: 40, make: r => { const rad = int(r, 3, 12); const deg = pick(r, [30, 45, 60, 90, 120, 180]); return { q: `A circle has radius ${rad}. What is the length of an arc subtending a central angle of ${deg} degrees, in terms of pi?`, a: piTerm(deg * rad, 180), why: `(${deg}/360)(2 pi ${rad}) = ${deg * rad}/180 pi.`, verify: v => near(v, deg * rad / 180) }; } },
  { topic: 'Geometry', secs: 45, make: r => { const k = int(r, 2, 5); const a = int(r, 2, 9); const b = int(r, 3, 11); return { q: `Two triangles are similar. The smaller has sides ${a} and ${b}; the larger has the side corresponding to ${a} equal to ${a * k}. What is the length of the side corresponding to ${b}?`, a: String(b * k), why: `The scale factor is ${k}, so ${b} becomes ${b * k}.`, verify: v => near(v / b, (a * k) / a), skipIf: () => a * k === b || a === b }; } },

  // ===== Trigonometry =====
  { topic: 'Trigonometry', secs: 10, make: r => { const o = pick(r, [[30, 'one half', 0.5], [90, '1', 1], [0, '0', 0], [150, 'one half', 0.5]]); return { q: `What is the exact value of the sine of ${o[0]} degrees?`, a: o[1], why: `sin ${o[0]}° = ${o[2]}.`, verify: () => near(Math.sin(o[0] * Math.PI / 180), o[2]), answerIsText: true }; } },
  { topic: 'Trigonometry', secs: 10, make: r => { const o = pick(r, [[0, '1', 1], [60, 'one half', 0.5], [180, 'negative 1', -1], [120, 'negative one half', -0.5]]); return { q: `What is the exact value of the cosine of ${o[0]} degrees?`, a: o[1], why: `cos ${o[0]}° = ${o[2]}.`, verify: () => near(Math.cos(o[0] * Math.PI / 180), o[2]), answerIsText: true }; } },
  { topic: 'Trigonometry', secs: 20, make: r => { const [a, b, c] = pick(r, PYTH); const f = pick(r, [['sine', a, c], ['cosine', b, c], ['tangent', a, b]]); return { q: `In a right triangle the leg opposite angle theta is ${a}, the leg adjacent is ${b}, and the hypotenuse is ${c}. What is the ${f[0]} of theta?`, a: frac(f[1], f[2]), why: `${f[0]} = ${f[1]}/${f[2]}.`, verify: v => near(v, fracVal(f[1], f[2])) }; } },
  { topic: 'Trigonometry', secs: 20, make: r => { const d = pick(r, [30, 45, 60, 90, 120, 135, 150, 180, 270, 360]); return { q: `Convert ${d} degrees to radians, in terms of pi.`, a: piTerm(d, 180), why: `${d} * pi/180 = ${frac(d, 180)} pi.`, verify: v => near(v * Math.PI, d * Math.PI / 180) }; } },
  { topic: 'Trigonometry', secs: 30, make: r => { const k = int(r, 2, 6); return { q: `What is the period of the function y equals the sine of ${k} x, in terms of pi?`, a: piTerm(2, k), why: `2 pi / ${k} = ${frac(2, k)} pi.`, verify: v => near(v, 2 / k) }; } },
  { topic: 'Trigonometry', secs: 20, make: r => { const A = int(r, 2, 9); const k = int(r, 1, 5); return { q: `What is the amplitude of the function y equals ${A} times the cosine of ${k} x?`, a: String(A), why: `Amplitude is the absolute value of the coefficient, ${A}.`, verify: v => near(v, A) }; } },
  { topic: 'Trigonometry', secs: 60, make: r => { const a = int(r, 3, 9); const b = int(r, 3, 9); return { q: `A triangle has sides of length ${a} and ${b} with an included angle of 60 degrees. What is the square of the length of the third side?`, a: String(a * a + b * b - a * b), why: `${a}^2 + ${b}^2 - 2(${a})(${b})cos60 = ${a * a + b * b - a * b}.`, verify: v => near(v, a * a + b * b - a * b) }; } },

  // ===== Probability & Statistics =====
  { topic: 'Probability & Statistics', secs: 30, make: r => { const s = int(r, 4, 10); let c = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === s) c++; return { q: `What is the probability of rolling a sum of ${s} with two standard six-sided dice?`, a: frac(c, 36), why: `${c} of the 36 equally likely outcomes total ${s}.`, verify: v => near(v, c / 36) }; } },
  { topic: 'Probability & Statistics', secs: 45, make: r => { const n = int(r, 3, 6); const k = int(r, 1, n - 1); const c = choose(n, k); return { q: `A fair coin is flipped ${spell[n]} times. What is the probability of getting exactly ${spell[k]} heads?`, a: frac(c, 2 ** n), why: `${n} choose ${k} = ${c}, out of ${2 ** n} outcomes.`, verify: v => { let cnt = 0; for (let m = 0; m < 2 ** n; m++) { let h = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) h++; if (h === k) cnt++; } return near(v, cnt / 2 ** n); } }; } },
  { topic: 'Probability & Statistics', secs: 45, make: r => { const a = int(r, 2, 7); const b = int(r, 2, 8); const tot = a + b; return { q: `A bag holds ${a} red and ${b} blue marbles. Two are drawn without replacement. What is the probability that both are red?`, a: frac(a * (a - 1), tot * (tot - 1)), why: `(${a}/${tot})(${a - 1}/${tot - 1}).`, verify: v => near(v, (a / tot) * ((a - 1) / (tot - 1))) }; } },
  { topic: 'Probability & Statistics', secs: 45, make: r => { const w = pick(r, ['LEVEL', 'BANANA', 'LETTER', 'BOOKKEEPER', 'MISSISSIPPI', 'COMMITTEE', 'BALLOON', 'SUCCESS']); const counts = {}; for (const ch of w) counts[ch] = (counts[ch] ?? 0) + 1; let d = 1; for (const k in counts) d *= fact(counts[k]); const ans = fact(w.length) / d; return { q: `How many distinguishable arrangements are there of the letters in the word ${w}?`, a: String(ans), why: `${w.length}! divided by ${Object.entries(counts).filter(([, n]) => n > 1).map(([c, n]) => `${n}! for the ${c}s`).join(' and ')} gives ${ans}.`, verify: v => near(v, fact(w.length) / d) }; } },
  { topic: 'Probability & Statistics', secs: 30, make: r => { const n = int(r, 5, 10); const k = int(r, 2, 4); return { q: `How many ways can a committee of ${spell[k]} be chosen from ${spell[n]} people?`, a: String(choose(n, k)), why: `${n} choose ${k} = ${choose(n, k)}.`, verify: v => near(v, choose(n, k)) }; } },
  { topic: 'Probability & Statistics', secs: 30, make: r => { const n = int(r, 4, 7); const k = int(r, 2, 3); const p = fact(n) / fact(n - k); return { q: `In how many ways can ${spell[k]} of ${spell[n]} runners finish first through ${k === 2 ? 'second' : 'third'}, if order matters?`, a: String(p), why: `${n}!/(${n}-${k})! = ${p}.`, verify: v => near(v, fact(n) / fact(n - k)) }; } },
  { topic: 'Probability & Statistics', secs: 30, make: r => { const vals = Array.from({ length: int(r, 4, 7) }, () => int(r, 1, 40)); const sum = vals.reduce((a, b) => a + b, 0); const n = vals.length; const mean = sum / n; return { q: `What is the mean of the numbers ${vals.join(', ')}?`, a: String(mean), why: `They sum to ${sum}, and ${sum}/${n} = ${mean}.`, verify: v => near(v * n, sum), skipIf: () => sum % n !== 0 }; } },
  { topic: 'Probability & Statistics', secs: 20, make: r => { const vals = Array.from({ length: 5 }, () => int(r, 1, 50)).sort((a, b) => a - b); return { q: `What is the median of the numbers ${vals.join(', ')}?`, a: String(vals[2]), why: `Sorted, the middle of five values is ${vals[2]}.`, verify: v => near(v, vals[2]) }; } },
  { topic: 'Probability & Statistics', secs: 20, make: r => { const vals = Array.from({ length: 6 }, () => int(r, 1, 60)); const rng2 = Math.max(...vals) - Math.min(...vals); return { q: `What is the range of the numbers ${vals.join(', ')}?`, a: String(rng2), why: `${Math.max(...vals)} - ${Math.min(...vals)} = ${rng2}.`, verify: v => near(v, rng2) }; } },
  { topic: 'Probability & Statistics', secs: 45, make: r => { const n1 = int(r, 2, 8); const s1 = int(r, 60, 95); const n2 = int(r, 2, 8); const s2 = int(r, 60, 95); const w = (n1 * s1 + n2 * s2) / (n1 + n2); return { q: `In a class, ${spell[n1]} students average ${s1} and ${spell[n2]} students average ${s2}. What is the average of all of them, to the nearest hundredth?`, a: String(Number(w.toFixed(2))), why: `(${n1}*${s1} + ${n2}*${s2}) / ${n1 + n2} = ${w.toFixed(4)}.`, verify: v => Math.abs(v - w) < 0.005 }; } },
  { topic: 'Probability & Statistics', secs: 45, make: r => { const a = int(r, 2, 6); const b = int(r, 2, 6); const tot = a + b; return { q: `A bag holds ${a} red and ${b} blue marbles. One is drawn at random. What is the probability that it is NOT red?`, a: frac(b, tot), why: `1 - ${a}/${tot} = ${frac(b, tot)}.`, verify: v => near(v, 1 - a / tot) }; } },

  // ===== Calculus =====
  { topic: 'Calculus', secs: 10, make: r => { const c = int(r, 2, 9); const n = int(r, 2, 7); return { q: `What is the derivative, with respect to x, of ${c} x to the ${n}th power?`, a: `${c * n} x to the ${n - 1}${n - 1 === 1 ? 'st' : 'th'} power`, why: `Power rule: ${c}*${n} = ${c * n}, exponent ${n - 1}.`, verify: () => { const f = x => c * x ** n; const h = 1e-6; const num = (f(2 + h) - f(2 - h)) / (2 * h); return near(num, c * n * 2 ** (n - 1), 1e-3); }, answerIsText: true }; } },
  { topic: 'Calculus', secs: 30, make: r => { const a = int(r, 1, 5); const b = int(r, 1, 9); const x = int(r, 1, 5); const d = 2 * a * x + b; return { q: `If f of x equals ${a} x squared plus ${b} x, what is f prime of ${x}?`, a: String(d), why: `f'(x) = ${2 * a}x + ${b}, so f'(${x}) = ${d}.`, verify: v => { const f = t => a * t * t + b * t; const h = 1e-6; return near((f(x + h) - f(x - h)) / (2 * h), v, 1e-4); } }; } },
  { topic: 'Calculus', secs: 30, make: r => { const c = int(r, 1, 6); const n = int(r, 1, 4); const u = int(r, 1, 4); const val = c * u ** (n + 1) / (n + 1); return { skipIf: () => !Number.isInteger(val), q: `Evaluate the integral from 0 to ${u} of ${c === 1 ? '' : c + ' '}x${n === 1 ? '' : ' to the ' + n + 'th power'}, with respect to x.`, a: String(val), why: `Antiderivative ${c}/${n + 1} x^${n + 1}, evaluated at ${u}, gives ${val}.`, verify: v => { let s = 0; const N = 200000; for (let i = 0; i < N; i++) { const x = (i + 0.5) * u / N; s += c * x ** n * (u / N); } return Math.abs(s - v) < 1e-3; } }; } },
  { topic: 'Calculus', secs: 45, make: r => { const a = int(r, 2, 9); return { q: `What is the limit, as x approaches ${a}, of the quantity x squared minus ${a * a}, all over x minus ${a}?`, a: String(2 * a), why: `The numerator factors as (x-${a})(x+${a}), leaving x+${a}, which approaches ${2 * a}.`, verify: v => { const f = x => (x * x - a * a) / (x - a); return near(f(a + 1e-7), v, 1e-4); } }; } },
  { topic: 'Calculus', secs: 30, make: r => { const a = int(r, 1, 4); const b = int(r, 1, 9); return { q: `What is the slope of the line tangent to the curve y equals ${a} x squared at the point where x equals ${b}?`, a: String(2 * a * b), why: `y' = ${2 * a}x, so at x = ${b} the slope is ${2 * a * b}.`, verify: v => { const f = x => a * x * x; const h = 1e-6; return near((f(b + h) - f(b - h)) / (2 * h), v, 1e-4); } }; } },

  // ===== Science/Health: kinematics =====
  // The archive states gravity explicitly as 10 m/s^2, which also keeps answers whole.
  { subject: 'Science/Health', topic: 'Physics - kinematics', secs: 30, make: r => { const t = int(r, 2, 6); const h = 5 * t * t; return { q: `Using acceleration due to gravity as 10 meters per second squared, a rock is thrown horizontally off a cliff ${h} meters high. How many seconds does it take to reach the ground?`, a: unit(t, 'second', 'seconds'), why: `h = (1/2)g t^2, so ${h} = 5 t^2 and t = ${t}.`, verify: v => near(5 * v * v, h) }; } },
  { subject: 'Science/Health', topic: 'Physics - kinematics', secs: 45, make: r => { const t = int(r, 2, 5); const h = 5 * t * t; const vx = int(r, 5, 25); return { q: `Using acceleration due to gravity as 10 meters per second squared, a rock is thrown horizontally at ${vx} meters per second off a cliff ${h} meters high. How many meters from the base of the cliff does it land?`, a: `${vx * t} meters`, why: `It falls for ${t} s, so the range is ${vx} * ${t} = ${vx * t} m.`, verify: v => near(v, vx * Math.sqrt(h / 5)) }; } },
  { subject: 'Science/Health', topic: 'Physics - kinematics', secs: 30, make: r => { const t = int(r, 2, 6); return { q: `Using acceleration due to gravity as 10 meters per second squared, an object is dropped from rest. What is its speed, in meters per second, after ${t} seconds?`, a: `${10 * t} meters per second`, why: `v = g t = 10 * ${t} = ${10 * t}.`, verify: v => near(v, 10 * t) }; } },
  { subject: 'Science/Health', topic: 'Physics - kinematics', secs: 30, make: r => { const v0 = int(r, 2, 20); const a = int(r, 2, 8); const t = int(r, 2, 6); return { q: `A car moving at ${v0} meters per second accelerates at ${a} meters per second squared for ${t} seconds. What is its final speed, in meters per second?`, a: `${v0 + a * t} meters per second`, why: `v = ${v0} + (${a})(${t}) = ${v0 + a * t}.`, verify: v => near(v, v0 + a * t) }; } },
  { subject: 'Science/Health', topic: 'Physics - kinematics', secs: 45, make: r => { const v0 = int(r, 10, 30); const v1 = v0 + int(r, 3, 24); const t = pick(r, [2, 3, 4, 6]); return { q: `A car speeds up from ${v0} meters per second to ${v1} meters per second in ${t} seconds. What is its acceleration, in meters per second squared?`, a: unit((v1 - v0) / t, 'meter per second squared', 'meters per second squared'), why: `(${v1} - ${v0}) / ${t} = ${(v1 - v0) / t}.`, verify: v => near(v * t, v1 - v0), skipIf: () => (v1 - v0) % t !== 0 }; } },

  // ===== Science/Health: forces =====
  { subject: 'Science/Health', topic: 'Physics - forces', secs: 30, make: r => { const m = int(r, 2, 40); const a = int(r, 2, 10); return { q: `What net force, in newtons, is required to give a ${m} kilogram mass an acceleration of ${a} meters per second squared?`, a: `${m * a} newtons`, why: `F = m a = ${m} * ${a} = ${m * a}.`, verify: v => near(v, m * a) }; } },
  { subject: 'Science/Health', topic: 'Physics - forces', secs: 30, make: r => { const m = int(r, 2, 50); return { q: `Using acceleration due to gravity as 10 meters per second squared, what is the weight, in newtons, of a ${m} kilogram object?`, a: `${10 * m} newtons`, why: `W = m g = ${m} * 10 = ${10 * m}.`, verify: v => near(v, 10 * m) }; } },
  { subject: 'Science/Health', topic: 'Physics - forces', secs: 30, make: r => { const m = int(r, 3, 30); const w = m * int(r, 2, 12); return { q: `On another planet a ${m} kilogram object weighs ${w} newtons. What is the gravitational field strength there, in newtons per kilogram?`, a: unit(w / m, 'newton per kilogram', 'newtons per kilogram'), why: `${w} / ${m} = ${w / m}.`, verify: v => near(v * m, w) }; } },
  { subject: 'Science/Health', topic: 'Physics - forces', secs: 45, make: r => { const m = int(r, 2, 10); const v0 = pick(r, [2, 4, 5, 6, 10]); const rad = pick(r, [1, 2, 4, 5]); const f = m * v0 * v0 / rad; return { q: `A ${m} kilogram object moves in a circle of radius ${rad} meters at ${v0} meters per second. What is the centripetal force, in newtons?`, a: `${f} newtons`, why: `F = m v^2 / r = ${m} * ${v0 * v0} / ${rad} = ${f}.`, verify: v => near(v * rad, m * v0 * v0), skipIf: () => !Number.isInteger(f) }; } },

  // ===== Science/Health: energy and power =====
  { subject: 'Science/Health', topic: 'Physics - energy', secs: 30, make: r => { const m = pick(r, [2, 4, 6, 8, 10]); const v0 = pick(r, [2, 4, 6, 10]); return { q: `What is the kinetic energy, in joules, of a ${m} kilogram object moving at ${v0} meters per second?`, a: `${0.5 * m * v0 * v0} joules`, why: `(1/2) m v^2 = 0.5 * ${m} * ${v0 * v0} = ${0.5 * m * v0 * v0}.`, verify: v => near(2 * v, m * v0 * v0) }; } },
  { subject: 'Science/Health', topic: 'Physics - energy', secs: 30, make: r => { const m = int(r, 2, 20); const h = int(r, 2, 20); return { q: `Using acceleration due to gravity as 10 meters per second squared, what is the gravitational potential energy, in joules, of a ${m} kilogram object raised ${h} meters?`, a: `${m * 10 * h} joules`, why: `m g h = ${m} * 10 * ${h} = ${m * 10 * h}.`, verify: v => near(v, m * 10 * h) }; } },
  { subject: 'Science/Health', topic: 'Physics - energy', secs: 30, make: r => { const f = int(r, 5, 60); const d = int(r, 2, 20); return { q: `How much work, in joules, is done by a force of ${f} newtons pushing an object ${d} meters in the direction of the force?`, a: `${f * d} joules`, why: `W = F d = ${f} * ${d} = ${f * d}.`, verify: v => near(v, f * d) }; } },
  { subject: 'Science/Health', topic: 'Physics - energy', secs: 45, make: r => { const w = int(r, 2, 40) * 10; const t = pick(r, [2, 4, 5, 10]); return { q: `A machine does ${w} joules of work in ${t} seconds. What is its power output, in watts?`, a: `${w / t} watts`, why: `P = W / t = ${w} / ${t} = ${w / t}.`, verify: v => near(v * t, w), skipIf: () => w % t !== 0 }; } },

  // ===== Science/Health: momentum =====
  { subject: 'Science/Health', topic: 'Physics - momentum', secs: 30, make: r => { const m = int(r, 2, 30); const v0 = int(r, 2, 20); return { q: `What is the momentum, in kilogram meters per second, of a ${m} kilogram object moving at ${v0} meters per second?`, a: `${m * v0} kilogram meters per second`, why: `p = m v = ${m} * ${v0} = ${m * v0}.`, verify: v => near(v, m * v0) }; } },
  { subject: 'Science/Health', topic: 'Physics - momentum', secs: 60, make: r => { const m1 = pick(r, [2, 4, 5, 6]); const v1 = pick(r, [3, 6, 9, 12]); const m2 = pick(r, [4, 6, 8, 10]); const vf = (m1 * v1) / (m1 + m2); return { q: `A ${m1} kilogram block moving at ${v1} meters per second collides with and sticks to a stationary ${m2} kilogram block. What is their combined speed, in meters per second?`, a: unit(vf, 'meter per second', 'meters per second'), why: `Momentum is conserved: ${m1 * v1} / ${m1 + m2} = ${vf}.`, verify: v => near(v * (m1 + m2), m1 * v1), skipIf: () => !Number.isInteger(vf * 10) }; } },

  // ===== Science/Health: electricity =====
  { subject: 'Science/Health', topic: 'Physics - electricity', secs: 30, make: r => { const i = pick(r, [2, 3, 4, 5]); const rr = int(r, 2, 20); return { q: `What voltage is needed to drive a current of ${i} amperes through a resistance of ${rr} ohms?`, a: `${i * rr} volts`, why: `V = I R = ${i} * ${rr} = ${i * rr}.`, verify: v => near(v, i * rr) }; } },
  { subject: 'Science/Health', topic: 'Physics - electricity', secs: 30, make: r => { const rr = pick(r, [2, 4, 5, 10, 20]); const v0 = rr * int(r, 2, 12); return { q: `How much current, in amperes, flows through a ${rr} ohm resistor connected to a ${v0} volt source?`, a: unit(v0 / rr, 'ampere', 'amperes'), why: `I = V / R = ${v0} / ${rr} = ${v0 / rr}.`, verify: v => near(v * rr, v0) }; } },
  { subject: 'Science/Health', topic: 'Physics - electricity', secs: 45, make: r => { const rr = pick(r, [5, 10, 20]); const v0 = pick(r, [10, 20, 40, 100]); const p = v0 * v0 / rr; return { q: `How much power, in watts, does a ${rr} ohm resistor dissipate across a ${v0} volt source?`, a: `${p} watts`, why: `P = V^2 / R = ${v0 * v0} / ${rr} = ${p}.`, verify: v => near(v * rr, v0 * v0), skipIf: () => !Number.isInteger(p) }; } },
  { subject: 'Science/Health', topic: 'Physics - electricity', secs: 30, make: r => { const p = pick(r, [60, 100, 120, 240]); const v0 = pick(r, [12, 24, 120]); return { q: `How much current, in amperes, does a ${p} watt bulb draw from a ${v0} volt supply?`, a: unit(frac(p, v0), 'ampere', 'amperes'), why: `I = P / V = ${p} / ${v0} = ${frac(p, v0)}.`, verify: v => near(v * v0, p) }; } },

  // ===== Science/Health: waves and density =====
  { subject: 'Science/Health', topic: 'Physics - waves', secs: 30, make: r => { const f = pick(r, [2, 4, 5, 10, 20]); const w = pick(r, [2, 3, 5, 10]); return { q: `A wave has a frequency of ${f} hertz and a wavelength of ${w} meters. What is its speed, in meters per second?`, a: unit(f * w, 'meter per second', 'meters per second'), why: `v = f lambda = ${f} * ${w} = ${f * w}.`, verify: v => near(v, f * w) }; } },
  { subject: 'Science/Health', topic: 'Physics - density', secs: 30, make: r => { const d = pick(r, [2, 3, 4, 5, 8]); const vol = int(r, 2, 25); return { q: `What is the mass, in grams, of ${vol} cubic centimeters of a substance with a density of ${d} grams per cubic centimeter?`, a: `${d * vol} grams`, why: `m = d V = ${d} * ${vol} = ${d * vol}.`, verify: v => near(v, d * vol) }; } },
  { subject: 'Science/Health', topic: 'Physics - density', secs: 30, make: r => { const d = pick(r, [2, 4, 5, 10]); const vol = int(r, 2, 20); const m = d * vol; return { q: `A sample has a mass of ${m} grams and a volume of ${vol} cubic centimeters. What is its density, in grams per cubic centimeter?`, a: `${d} grams per cubic centimeter`, why: `${m} / ${vol} = ${d}.`, verify: v => near(v * vol, m) }; } },

  // ===== Science/Health: chemistry computation =====
  { subject: 'Science/Health', topic: 'Chemistry', secs: 30, make: r => { const c = pick(r, [['H2O', 18, 'water'], ['CO2', 44, 'carbon dioxide'], ['NaCl', 58.5, 'sodium chloride'], ['CH4', 16, 'methane'], ['NH3', 17, 'ammonia'], ['C6H12O6', 180, 'glucose'], ['H2SO4', 98, 'sulfuric acid'], ['CaCO3', 100, 'calcium carbonate']]); return { q: `What is the molar mass, in grams per mole, of ${c[2]}, formula ${c[0]}?`, a: `${c[1]} grams per mole`, why: `Summing the atomic masses in ${c[0]} gives about ${c[1]} g/mol.`, verify: v => near(v, c[1], 0.6) }; } },
  { subject: 'Science/Health', topic: 'Chemistry', secs: 30, make: r => { const c = pick(r, [['calcium nitrate', 'Ca(NO3)2', 9], ['aluminum carbonate', 'Al2(CO3)3', 14], ['ammonium sulfate', '(NH4)2SO4', 15], ['magnesium hydroxide', 'Mg(OH)2', 5], ['sodium bicarbonate', 'NaHCO3', 6]]); return { q: `How many atoms are there in one formula unit of ${c[0]}, formula ${c[1]}?`, a: String(c[2]), why: `Counting every atom in ${c[1]} gives ${c[2]}.`, verify: v => near(v, c[2]) }; } },
  { subject: 'Science/Health', topic: 'Chemistry', secs: 45, make: r => { const c = pick(r, [['water', 18, 16, 'oxygen'], ['carbon dioxide', 44, 32, 'oxygen'], ['methane', 16, 12, 'carbon'], ['ammonia', 17, 14, 'nitrogen']]); const pct = (c[2] / c[1]) * 100; return { q: `To the nearest whole percent, what percent of the mass of ${c[0]} is ${c[3]}?`, a: `${Math.round(pct)} percent`, why: `${c[2]} of ${c[1]} g/mol is about ${pct.toFixed(1)}%.`, verify: v => Math.abs(v - pct) < 1 }; } },
  { subject: 'Science/Health', topic: 'Chemistry', secs: 30, make: r => { const u = pick(r, [['kilometers', 'meters', 1000], ['meters', 'centimeters', 100], ['kilograms', 'grams', 1000], ['liters', 'milliliters', 1000], ['meters', 'millimeters', 1000]]); const n = int(r, 2, 40); return { q: `How many ${u[1]} are there in ${n} ${u[0]}?`, a: String(n * u[2]), why: `${n} * ${u[2]} = ${n * u[2]}.`, verify: v => near(v, n * u[2]) }; } }
];

// ---------- build + verify ----------

/**
 * The number a verify() should be handed for an answer string. Worded answers
 * ("10 times the square root of 2") verify themselves and get NaN.
 * @param {{a: string, answerIsText: ?boolean}} inst
 * @returns {number}
 */
function numericAnswer (inst) {
  if (inst.answerIsText) { return NaN; }
  const raw = String(inst.a);
  const cleaned = raw.replace(/[^0-9./-]/g, '');
  if (cleaned === '' || cleaned === '-') {
    // "pi" and "negative pi" carry an implied coefficient of 1
    if (raw.includes('pi')) { return raw.includes('negative') || raw.startsWith('-') ? -1 : 1; }
    return NaN;
  }
  const parts = cleaned.split('/');
  if (parts.length === 2 && parts[0] !== '' && parts[1] !== '') {
    return Number(parts[0]) / Number(parts[1]);
  }
  return Number(cleaned);
}

const argv = yargs(process.argv.slice(2))
  .option('write', { type: 'boolean', default: false, description: 'insert into the review queue' })
  .option('per', { type: 'number', default: 3, description: 'instances per template' })
  .option('seed', { type: 'number', default: 20260926, description: 'RNG seed' })
  .option('show', { type: 'number', default: 6, description: 'how many samples to print on a dry run' })
  .option('subject', { type: 'string', description: 'only this subject, e.g. "Science/Health"' })
  .help()
  .argv;

const r = rng(argv.seed);
const built = [];
const failed = [];
const seen = new Set();

for (const t of T) {
  if (argv.subject && (t.subject ?? 'Mathematics') !== argv.subject) { continue; }
  let made = 0;
  for (let attempt = 0; attempt < argv.per * 8 && made < argv.per; attempt++) {
    let inst;
    try { inst = t.make(r); } catch (e) { continue; }
    if (!inst || (inst.skipIf && inst.skipIf())) { continue; }

    const key = inst.q.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) { continue; }

    // independent check: for numeric answers parse the stated answer back out
    // and hand it to verify(); for worded answers verify() checks itself
    let ok = true;
    if (inst.verify) {
      try { ok = inst.verify(numericAnswer(inst)); } catch (e) { ok = false; }
    }
    if (!ok) { failed.push({ topic: t.topic, q: inst.q, a: inst.a }); continue; }

    seen.add(key);
    made++;
    built.push({
      subject: t.subject ?? 'Mathematics',
      topic: t.topic,
      question: `[${t.secs} sec] ${inst.q}`,
      answer: inst.a,
      solution: inst.why,
      timedSeconds: t.secs,
      status: 'pending',
      source: 'claude-generated',
      createdAt: new Date()
    });
  }
}

const byTopic = {};
built.forEach(b => { byTopic[b.subject + ' / ' + b.topic] = (byTopic[b.subject + ' / ' + b.topic] ?? 0) + 1; });

console.log(`templates: ${T.length}`);
console.log(`built and verified: ${built.length}`);
console.log(`failed verification (discarded): ${failed.length}`);
if (failed.length) {
  failed.slice(0, 10).forEach(f => console.log(`   ! ${f.topic}: ${f.q} -> "${f.a}"`));
}
console.log('\nby topic:');
Object.entries(byTopic).sort().forEach(([t, n]) => console.log(`  ${t.padEnd(42)}${n}`));

if (!argv.write) {
  console.log('\nDRY RUN - pass --write to insert. Sample:');
  built.slice(0, argv.show).forEach(b => console.log(`\n  ${b.question}\n    ANSWER: ${b.answer}\n    check:  ${b.solution}`));
  process.exit(failed.length ? 1 : 0);
}

// skip anything already queued, so re-running tops up rather than duplicates
const existing = new Set((await pending.distinct('question')).map(q => String(q)));
const fresh = built.filter(b => !existing.has(b.question));
console.log(`\nalready in the queue: ${built.length - fresh.length}`);
if (!fresh.length) {
  console.log('nothing new to insert');
  process.exit(0);
}
const res = await pending.insertMany(fresh);
console.log(`inserted ${res.insertedCount} new questions`);
console.log(`queue now holds ${await pending.countDocuments({ status: 'pending' })} pending`);
process.exit(0);
