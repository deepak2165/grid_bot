import express from 'express';
import * as controller from './botController.js';

const router = express.Router();

router.post('/create', controller.create_bot);
router.put('/stop', controller.stop_bot);

export default router;