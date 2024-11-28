import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  // console.log(`/api/auth: LOGOUT: User ${req.session.username} successfully logged out.`);
  req.session = null;
  res.sendStatus(200);
});

export default router;
