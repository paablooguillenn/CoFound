import { Router } from 'express';

import {
  activateBoostController,
  changeEmailController,
  changePasswordController,
  completenessController,
  confirmEmailVerificationController,
  deactivateAccountController,
  deleteAccountController,
  exportDataController,
  getBoostStatusController,
  getMyProfileController,
  getPreferencesController,
  reactivateAccountController,
  requestEmailVerificationController,
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
profileRouter.get('/completeness', completenessController);
profileRouter.post('/boost', activateBoostController);
profileRouter.get('/boost', getBoostStatusController);
profileRouter.post('/verify-email/request', requestEmailVerificationController);
profileRouter.post('/verify-email/confirm', confirmEmailVerificationController);
