import packetMetadataRouter from './packet-metadata.js';
import setMetadataRouter from './set-metadata.js';

import { Router } from 'express';

const router = Router();

router.use('/packet-metadata', packetMetadataRouter);
router.use('/set-metadata', setMetadataRouter);

export default router;
