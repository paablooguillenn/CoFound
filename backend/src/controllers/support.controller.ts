import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { createSupportMessage, listSupportMessages } from '../services/support.service';

const supportSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
});

export const createSupportMessageController = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { subject, body } = supportSchema.parse(request.body);
    const result = await createSupportMessage({
      userId: request.user!.id,
      subject,
      body,
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const listSupportMessagesController = async (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const messages = await listSupportMessages();
    response.json({ messages });
  } catch (error) {
    next(error);
  }
};
