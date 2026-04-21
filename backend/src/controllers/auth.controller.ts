import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { loginUser, registerUser } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = registerSchema.parse(request.body);
    const result = await registerUser(payload);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = loginSchema.parse(request.body);
    const result = await loginUser(payload);
    response.json(result);
  } catch (error) {
    next(error);
  }
};
