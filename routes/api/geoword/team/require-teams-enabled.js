export default function requireTeamsEnabled (req, res, next) {
  if (!res.locals.set.teamsEnabled) {
    return res.status(403).send('Team registration is not open for this set.');
  }

  next();
}
