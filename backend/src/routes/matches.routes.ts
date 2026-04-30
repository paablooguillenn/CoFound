import { Router } from 'express';

import { getMatchesController, likeUserController, passUserController, superLikeUserController, getMatchProfileController, unmatchController, blockUserController, reportUserController, getUnreadController, markReadController, rewindController, getLikesReceivedController, getBlockedUsersController, unblockUserController } from '../controllers/matches.controller';
import { getMessagesController, sendMessageController } from '../controllers/messages.controller';

export const matchesRouter = Router();

matchesRouter.get('/', getMatchesController);
matchesRouter.get('/unread', getUnreadController);
matchesRouter.post('/like', likeUserController);
matchesRouter.post('/pass', passUserController);
matchesRouter.post('/superlike', superLikeUserController);
matchesRouter.post('/rewind', rewindController);
matchesRouter.get('/likes-received', getLikesReceivedController);
matchesRouter.get('/blocked', getBlockedUsersController);
matchesRouter.delete('/blocked/:userId', unblockUserController);
matchesRouter.post('/block', blockUserController);
matchesRouter.post('/report', reportUserController);
matchesRouter.get('/:matchId/profile', getMatchProfileController);
matchesRouter.delete('/:matchId', unmatchController);
matchesRouter.get('/:matchId/messages', getMessagesController);
matchesRouter.post('/:matchId/messages', sendMessageController);
matchesRouter.post('/:matchId/read', markReadController);
