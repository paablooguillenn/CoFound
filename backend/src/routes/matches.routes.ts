import { Router } from 'express';

import { getMatchesController, likeUserController, passUserController, superLikeUserController, getMatchProfileController, unmatchController, blockUserController, reportUserController, getUnreadController, markReadController, rewindController, getLikesReceivedController, getBlockedUsersController, unblockUserController, latestUnreadController, likesSentController, profileVisitorsController } from '../controllers/matches.controller';
import { clearReactionController, deleteMessageController, getMessagesController, sendMessageController, setReactionController } from '../controllers/messages.controller';

export const matchesRouter = Router();

matchesRouter.get('/', getMatchesController);
matchesRouter.get('/unread', getUnreadController);
matchesRouter.get('/latest-unread', latestUnreadController);
matchesRouter.post('/like', likeUserController);
matchesRouter.post('/pass', passUserController);
matchesRouter.post('/superlike', superLikeUserController);
matchesRouter.post('/rewind', rewindController);
matchesRouter.get('/likes-received', getLikesReceivedController);
matchesRouter.get('/likes-sent', likesSentController);
matchesRouter.get('/profile-visitors', profileVisitorsController);
matchesRouter.get('/blocked', getBlockedUsersController);
matchesRouter.delete('/blocked/:userId', unblockUserController);
matchesRouter.post('/block', blockUserController);
matchesRouter.post('/report', reportUserController);
matchesRouter.get('/:matchId/profile', getMatchProfileController);
matchesRouter.delete('/:matchId', unmatchController);
matchesRouter.get('/:matchId/messages', getMessagesController);
matchesRouter.post('/:matchId/messages', sendMessageController);
matchesRouter.delete('/:matchId/messages/:messageId', deleteMessageController);
matchesRouter.post('/:matchId/messages/:messageId/reactions', setReactionController);
matchesRouter.delete('/:matchId/messages/:messageId/reactions', clearReactionController);
matchesRouter.post('/:matchId/read', markReadController);
