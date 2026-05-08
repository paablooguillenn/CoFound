import { Router } from 'express';

import { backfillSeedsController, getStatsController, listReportsController, reseedController } from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.get('/reports', listReportsController);
adminRouter.get('/stats', getStatsController);
adminRouter.post('/backfill-seeds', backfillSeedsController);
adminRouter.post('/reseed', reseedController);
