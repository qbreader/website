export default function unformatString (string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018-\u201B]/g, '\'')
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2032-\u2037]/g, '\'')
    .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
    .replace(/\u0142/g, 'l') // ł -> l
    .replace(/\u00F8/g, 'o'); // ø -> o
}
