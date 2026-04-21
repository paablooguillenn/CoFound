import { Router } from 'express';

import { getMyProfileController, updateMyProfileController, upgradePremiumController } from '../controllers/profile.controller';

export const profileRouter = Router();

profileRouter.get('/me', getMyProfileController);
profileRouter.put('/me', updateMyProfileController);
profileRouter.post('/premium', upgradePremiumController);
