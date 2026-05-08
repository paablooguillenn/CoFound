import { NextFunction, Request, Response } from 'express';

import { backfillSeedExtras, getStats, listReports } from '../services/admin.service';

export const listReportsController = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const reports = await listReports();
    response.json({ reports });
  } catch (error) {
    next(error);
  }
};

export const getStatsController = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const stats = await getStats();
    response.json({ stats });
  } catch (error) {
    next(error);
  }
};

export const backfillSeedsController = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const summary = await backfillSeedExtras();
    response.json({ ok: true, summary });
  } catch (error) {
    next(error);
  }
};
