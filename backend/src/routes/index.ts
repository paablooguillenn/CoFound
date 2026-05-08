import { Router } from 'express';

import { adminMiddleware } from '../middleware/admin.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { discoveryRouter } from './discovery.routes';
import { matchesRouter } from './matches.routes';
import { profileRouter } from './profile.routes';
import { getMyPhotosController, addPhotoController, deletePhotoController } from '../controllers/photos.controller';
import { createSupportMessageController, listSupportMessagesController } from '../controllers/support.controller';
import { getPublicUserProfileController } from '../controllers/users.controller';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', authMiddleware, profileRouter);
apiRouter.use('/discovery', authMiddleware, discoveryRouter);
apiRouter.use('/matches', authMiddleware, matchesRouter);
apiRouter.use('/admin', authMiddleware, adminMiddleware, adminRouter);

// Public user profile (auth required, returns full profile of any non-blocked user)
apiRouter.get('/users/:userId', authMiddleware, getPublicUserProfileController);

// Support / contact
apiRouter.post('/support', authMiddleware, createSupportMessageController);
apiRouter.get('/admin/support', authMiddleware, adminMiddleware, listSupportMessagesController);

// Photos
apiRouter.get('/photos', authMiddleware, getMyPhotosController);
apiRouter.post('/photos', authMiddleware, addPhotoController);
apiRouter.delete('/photos/:photoId', authMiddleware, deletePhotoController);
