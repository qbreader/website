/**
 * @param {{ wins: number, losses: number, ties: number }} record
 * @returns {number | null} the share of matches won, with a tie as half a win, or null before any match
 */
export default function getWinPercentage ({ wins, losses, ties }) {
  const played = wins + losses + ties;
  return played === 0 ? null : (wins + ties / 2) / played;
}
