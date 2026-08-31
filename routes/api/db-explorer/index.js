import packetMetadataRouter from './packet-metadata.js';

import { Router } from 'express';

const router = Router();

router.use('/packet-metadata', packetMetadataRouter);

export default router;
