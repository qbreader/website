/**
 * @param {Object[]} buzzes - buzzes with a `user_id`
 * @returns {Map<string, Object[]>} each user's buzzes, keyed by the string form of their id
 */
export default function groupBuzzesByUser (buzzes) {
  const buzzesByUser = new Map();
  for (const buzz of buzzes) {
    const key = String(buzz.user_id);
    if (!buzzesByUser.has(key)) { buzzesByUser.set(key, []); }
    buzzesByUser.get(key).push(buzz);
  }
  return buzzesByUser;
}
