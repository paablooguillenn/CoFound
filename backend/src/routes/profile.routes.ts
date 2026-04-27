import { Router } from 'express';

import {
  changeEmailController,
  changePasswordController,
  deactivateAccountController,
  deleteAccountController,
  exportDataController,
  getMyProfileController,
  getPreferencesController,
  reactivateAccountController,
  toggle2FAController,
  updateMyProfileController,
  updatePreferencesController,
  upgradePremiumController,
} from '../controllers/profile.controller';

export const profileRouter = Router();

profileRouter.get('/me', getMyProfileController);
profileRouter.put('/me', updateMyProfileController);
profileRouter.delete('/me', deleteAccountController);
profileRouter.post('/premium', upgradePremiumController);
profileRouter.patch('/email', changeEmailController);
profileRouter.patch('/password', changePasswordController);
profileRouter.post('/deactivate', deactivateAccountController);
profileRouter.post('/reactivate', reactivateAccountController);
profileRouter.get('/preferences', getPreferencesController);
profileRouter.patch('/preferences', updatePreferencesController);
profileRouter.post('/2fa', toggle2FAController);
profileRouter.get('/export', exportDataController);
