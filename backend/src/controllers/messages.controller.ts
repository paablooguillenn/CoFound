import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { deleteMessage, getMessages, sendMessage } from '../services/message.service';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const getMessagesController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { matchId } = request.params;
    const messages = await getMessages(request.user!.id, matchId);
    response.json({ messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessageController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { matchId } = request.params;
    const payload = sendMessageSchema.parse(request.body);
    const result = await sendMessage(request.user!.id, matchId, payload.content);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteMessageController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { messageId } = request.params;
    const result = await deleteMessage(request.user!.id, messageId);
    response.json(result);
  } catch (error) {
    next(error);
  }
};
