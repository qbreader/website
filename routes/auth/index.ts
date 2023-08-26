import editProfileRouter from './edit-profile.js';
import editPasswordRouter from './edit-password.js';
import getProfileRouter from './get-profile.js';
import getUsernameRouter from './get-username.js';
import loginRouter from './login.js';
import logoutRouter from './logout.js';
import recordBonusRouter from './record-bonus.js';
import recordTossupRouter from './record-tossup.js';
import resetPasswordRouter from './reset-password.js';
import sendPasswordResetEmailRouter from './send-password-reset-email.js';
import sendVerificationEmailRouter from './send-verification-email.js';
import signupRouter from './signup.js';
import statsRouter from './stats.js';
import userStatsRouter from './user-stats.js';
import verifyEmailRouter from './verify-email.js';
import verifyResetPasswordRouter from './verify-reset-password.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(rateLimit({
    windowMs: 1000, // 4 seconds
    max: 20, // Limit each IP to 20 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}));


router.use('/edit-password', editPasswordRouter);

router.use('/edit-profile', editProfileRouter);

router.use('/get-profile', getProfileRouter);

router.use('/get-username', getUsernameRouter);

router.use('/login', loginRouter);

router.use('/logout', logoutRouter);

router.use('/record-bonus', recordBonusRouter);

router.use('/record-tossup', recordTossupRouter);

router.use('/reset-password', resetPasswordRouter);

router.use('/send-password-reset-email', sendPasswordResetEmailRouter);

router.use('/send-verification-email', sendVerificationEmailRouter);

router.use('/signup', signupRouter);

router.use('/stats', statsRouter);

router.use('/user-stats', userStatsRouter);

router.use('/verify-email', verifyEmailRouter);

router.use('/verify-reset-password', verifyResetPasswordRouter);

export default router;
