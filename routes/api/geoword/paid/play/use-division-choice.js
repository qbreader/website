import getUserId from '../../../../../database/account-info/get-user-id.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';

export default async function useDivisionChoice (req, res, next) {
  const userId = await getUserId(req.session.username);
  const division = await getDivisionChoice(req.query.packetName, userId);

  if (!division) {
    return res.status(400).send('Choose a division first');
  }

  req.query.division = division;
  next();
}
