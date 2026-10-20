/**
 * Lets a request through only if the set has team registration open (`teamsEnabled`).
 * Used on creating and joining; players already on a team keep access to everything else.
 */
export default function requireTeamsEnabled (req, res, next) {
  if (!res.locals.set.teamsEnabled) {
    return res.status(403).send('Team registration is not open for this set.');
  }

  next();
}
