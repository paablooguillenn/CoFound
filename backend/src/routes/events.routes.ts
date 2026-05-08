import { Router } from 'express';

import {
  createEventController,
  deleteEventController,
  getEventController,
  listEventsController,
  setRsvpController,
  updateEventController,
} from '../controllers/events.controller';

export const eventsRouter = Router();

eventsRouter.get('/', listEventsController);
eventsRouter.post('/', createEventController);
eventsRouter.get('/:eventId', getEventController);
eventsRouter.patch('/:eventId', updateEventController);
eventsRouter.delete('/:eventId', deleteEventController);
eventsRouter.post('/:eventId/rsvp', setRsvpController);
