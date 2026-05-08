import { Router } from 'express';

import { backfillSeedsController, getStatsController, listReportsController } from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.get('/reports', listReportsController);
adminRouter.get('/stats', getStatsController);
adminRouter.post('/backfill-seeds', backfillSeedsController);
