import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware';
import { authRouter } from './auth.routes';
import { discoveryRouter } from './discovery.routes';
import { matchesRouter } from './matches.routes';
import { profileRouter } from './profile.routes';
import { getMyPhotosController, addPhotoController, deletePhotoController } from '../controllers/photos.controller';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', authMiddleware, profileRouter);
apiRouter.use('/discovery', authMiddleware, discoveryRouter);
apiRouter.use('/matches', authMiddleware, matchesRouter);

// Photos
apiRouter.get('/photos', authMiddleware, getMyPhotosController);
apiRouter.post('/photos', authMiddleware, addPhotoController);
apiRouter.delete('/photos/:photoId', authMiddleware, deletePhotoController);
