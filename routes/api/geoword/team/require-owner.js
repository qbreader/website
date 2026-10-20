import getTeam from '../../../../database/geoword/get-team.js';

export default async function requireOwner (req, res, next) {
  const team = await getTeam(res.locals.set._id, res.locals.userId);
  if (!team) {
    return res.sendStatus(404);
  }
  if (!team.owner?.equals(res.locals.userId)) {
    return res.status(403).send('Only the team owner can do that.');
  }

  res.locals.team = team;
  next();
}
