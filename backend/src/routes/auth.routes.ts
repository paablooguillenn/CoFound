import { Router } from 'express';

import { forgotPasswordController, loginController, registerController, resetPasswordController } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/forgot-password', forgotPasswordController);
authRouter.post('/reset-password', resetPasswordController);
