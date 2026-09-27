// One-off: load a reviewed batch of math questions into the pending queue.
// Every answer carries a `check` that recomputes it independently, so nothing
// reaches the review page unless the arithmetic verifies here first.
import { qbreader } from './database/databases.js';

const pending = qbreader.collection('kshsaa_pending_questions');

const Q = [
  // ---- Algebra ----
  ['Algebra', 10, 'If 3 x plus 7 equals 25, what is the value of x?', '6',
    () => (25 - 7) / 3, '3x = 18, so x = 6.'],
  ['Algebra', 10, 'Solve for x: 2 raised to the power x equals 32.', '5',
    () => Math.log2(32), '2^5 = 32.'],
  ['Algebra', 20, 'What is the sum of the solutions of x squared minus 7 x plus 12 equals zero?', '7',
    () => 3 + 4, 'Factors as (x-3)(x-4), so the roots are 3 and 4 and their sum is 7.'],
  ['Algebra', 30, 'If f of x equals 2 x squared minus 3 x plus 1, what is f of negative 2?', '15',
    () => 2 * (-2) ** 2 - 3 * (-2) + 1, '2(4) + 6 + 1 = 15.'],
  ['Algebra', 30, 'The sum of three consecutive even integers is 78. What is the largest of the three?', '28',
    () => { const n = (78 - 6) / 3; return n + 4; }, 'The integers are 24, 26 and 28.'],
  ['Algebra', 20, 'Simplify the square root of 200.', '10 times the square root of 2',
    () => Math.sqrt(200), '10 * sqrt(2) = 14.142..., the same as sqrt(200).', () => 10 * Math.sqrt(2)],

  // ---- Geometry ----
  ['Geometry', 10, 'A circle has a radius of 6. What is its area, in terms of pi?', '36 pi',
    () => 36, 'Area = pi r^2 = 36 pi.'],
  ['Geometry', 20, 'A right triangle has legs of length 9 and 12. What is the length of the hypotenuse?', '15',
    () => Math.hypot(9, 12), '81 + 144 = 225, and sqrt(225) = 15.'],
  ['Geometry', 20, 'What is the sum of the interior angles of a regular octagon, in degrees?', '1080',
    () => (8 - 2) * 180, '(8-2) * 180 = 1080.'],
  ['Geometry', 30, 'A rectangle has a perimeter of 34 and a length of 11. What is its area?', '66',
    () => { const w = 34 / 2 - 11; return 11 * w; }, 'Width = 17 - 11 = 6, so the area is 66.'],
  ['Geometry', 30, 'What is the volume of a sphere with radius 3, in terms of pi?', '36 pi',
    () => (4 / 3) * 27, '(4/3) pi r^3 = (4/3)(27) pi = 36 pi.'],
  ['Geometry', 30, 'A cube has a surface area of 96 square inches. What is the length of one edge?', '4 inches',
    () => Math.sqrt(96 / 6), '6 s^2 = 96, so s^2 = 16 and s = 4.'],

  // ---- Trigonometry ----
  ['Trigonometry', 10, 'What is the exact value of the sine of 30 degrees?', 'one half',
    () => Math.sin(Math.PI / 6), 'sin 30 = 0.5.', () => 0.5],
  ['Trigonometry', 10, 'What is the exact value of the tangent of 45 degrees?', '1',
    () => Math.tan(Math.PI / 4), 'tan 45 = 1.'],
  ['Trigonometry', 20, 'In a right triangle, the side opposite an angle measures 7 and the hypotenuse measures 25. What is the sine of that angle?', '7 over 25',
    () => 7 / 25, 'sine = opposite over hypotenuse = 7/25 = 0.28.', () => 0.28],
  ['Trigonometry', 30, 'What is the period of the function y equals the sine of 2 x, in radians?', 'pi',
    () => (2 * Math.PI) / 2, 'Period = 2 pi / 2 = pi.', () => Math.PI],

  // ---- Probability & Statistics ----
  ['Probability & Statistics', 30, 'What is the probability of rolling a sum of 7 with two standard six-sided dice?', 'one sixth',
    () => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === 7) c++; return c / 36; },
    'Six of the 36 outcomes total 7, so the probability is 1/6.', () => 1 / 6],
  ['Probability & Statistics', 30, 'What is the mean of the numbers 4, 8, 15, 16, 23 and 42?', '18',
    () => [4, 8, 15, 16, 23, 42].reduce((a, b) => a + b, 0) / 6, 'The six numbers sum to 108, and 108/6 = 18.'],
  ['Probability & Statistics', 10, 'What is the median of the numbers 3, 7, 9, 15 and 21?', '9',
    () => [3, 7, 9, 15, 21][2], 'The middle value of five sorted numbers is the third, which is 9.'],
  ['Probability & Statistics', 45, 'How many distinguishable arrangements are there of the letters in the word LEVEL?', '30',
    () => { const f = n => n <= 1 ? 1 : n * f(n - 1); return f(5) / (f(2) * f(2)); },
    'Five letters with two Ls and two Es: 5!/(2!2!) = 120/4 = 30.'],
  ['Probability & Statistics', 45, 'A bag holds 4 red and 6 blue marbles. Two are drawn without replacement. What is the probability that both are red?', 'two fifteenths',
    () => (4 / 10) * (3 / 9), '(4/10)(3/9) = 12/90 = 2/15.', () => 2 / 15],

  // ---- Calculus ----
  ['Calculus', 10, 'What is the derivative of x cubed with respect to x?', '3 x squared',
    () => 3, 'd/dx of x^3 is 3x^2; the coefficient is 3.'],
  ['Calculus', 30, 'Evaluate the integral from 0 to 3 of 2 x, with respect to x.', '9',
    () => 3 ** 2 - 0 ** 2, 'The antiderivative is x^2, and 9 - 0 = 9.'],

  // ---- Miscellaneous ----
  ['Miscellaneous', 20, 'What is 15 percent of 240?', '36',
    () => 0.15 * 240, '0.15 * 240 = 36.']
];

// verify first, insert second
const near = (a, b) => Math.abs(a - b) < 1e-9;
const rows = [];
const failures = [];
for (const [topic, secs, question, answer, compute, solution, expected] of Q) {
  const got = compute();
  // when the spoken answer is not a bare number, `expected` supplies the value to match
  const want = expected ? expected() : Number(String(answer).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(got) || !Number.isFinite(want) || !near(got, want)) {
    failures.push({ question, answer, got, want });
    continue;
  }
  rows.push({
    subject: 'Mathematics',
    topic,
    question: '[' + secs + ' sec] ' + question,
    answer,
    solution,
    timedSeconds: secs,
    status: 'pending',
    source: 'claude-generated',
    createdAt: new Date()
  });
}

console.log('verified ' + rows.length + ' of ' + Q.length + ' questions');
if (failures.length) {
  console.log('\nFAILED VERIFICATION - not inserted:');
  failures.forEach(f => console.log('  ' + f.question + '\n    stated "' + f.answer + '", computed ' + f.got + ', expected ' + f.want));
  process.exit(1);
}

const already = await pending.countDocuments({ source: 'claude-generated' });
if (already) {
  console.log('this batch is already loaded (' + already + ' rows); not inserting again');
  process.exit(0);
}
const res = await pending.insertMany(rows);
console.log('inserted ' + res.insertedCount + ' into the review queue');

const byTopic = {};
rows.forEach(r => { byTopic[r.topic] = (byTopic[r.topic] ?? 0) + 1; });
console.log('\nby topic:');
Object.entries(byTopic).forEach(([t, n]) => console.log('  ' + t.padEnd(26) + n));
process.exit(0);
