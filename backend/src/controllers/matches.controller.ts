import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { getMatches, likeUser, passUser, unmatchUser, blockUser, getMatchProfile, reportUser, getUnreadTotal } from '../services/match.service';

const likeSchema = z.object({
  targetUserId: z.string().uuid(),
});

const passSchema = z.object({
  targetUserId: z.string().uuid(),
});

const blockSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

const reportSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1),
});

export const likeUserController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = likeSchema.parse(request.body);
    const result = await likeUser(request.user!.id, payload.targetUserId);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const passUserController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = passSchema.parse(request.body);
    const result = await passUser(request.user!.id, payload.targetUserId);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMatchesController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const matches = await getMatches(request.user!.id);
    response.json({ matches });
  } catch (error) {
    next(error);
  }
};

export const getUnreadController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const total = await getUnreadTotal(request.user!.id);
    response.json({ unreadCount: total });
  } catch (error) {
    next(error);
  }
};

export const markReadController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { pool } = await import('../config/database');
    await pool.query(
      `UPDATE messages SET read_at = now()
       WHERE match_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
      [request.params.matchId, request.user!.id],
    );
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getMatchProfileController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const profile = await getMatchProfile(request.user!.id, request.params.matchId);
    response.json(profile);
  } catch (error) {
    next(error);
  }
};

export const unmatchController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await unmatchUser(request.user!.id, request.params.matchId);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const reportUserController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = reportSchema.parse(request.body);
    const result = await reportUser(request.user!.id, payload.userId, payload.reason);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const blockUserController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = blockSchema.parse(request.body);
    const result = await blockUser(request.user!.id, payload.userId, payload.reason);
    response.json(result);
  } catch (error) {
    next(error);
  }
};
