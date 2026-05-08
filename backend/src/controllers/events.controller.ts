import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import {
  ATTENDEE_STATUSES,
  EVENT_CATEGORIES,
  createEvent,
  deleteEvent,
  getEventById,
  listUpcomingEvents,
  setRsvp,
  updateEvent,
} from '../services/events.service';

const eventInputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  category: z.enum(EVENT_CATEGORIES),
  city: z.string().max(80).optional(),
  location: z.string().max(200).optional(),
  startsAt: z.string().min(1),
  capacity: z.number().int().min(2).max(500).nullable().optional(),
});

const rsvpSchema = z.object({
  status: z.enum(ATTENDEE_STATUSES).nullable(),
});

const listQuerySchema = z.object({
  city: z.string().min(1).max(80).optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
});

export const listEventsController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const filters = listQuerySchema.parse(request.query);
    const events = await listUpcomingEvents(request.user!.id, filters);
    response.json({ events });
  } catch (error) {
    next(error);
  }
};

export const getEventController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const event = await getEventById(request.user!.id, request.params.eventId);
    response.json(event);
  } catch (error) {
    next(error);
  }
};

export const createEventController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = eventInputSchema.parse(request.body);
    const event = await createEvent(request.user!.id, payload);
    response.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = eventInputSchema.parse(request.body);
    const event = await updateEvent(request.user!.id, request.params.eventId, payload);
    response.json(event);
  } catch (error) {
    next(error);
  }
};

export const deleteEventController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await deleteEvent(request.user!.id, request.params.eventId);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const setRsvpController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { status } = rsvpSchema.parse(request.body);
    const result = await setRsvp(request.user!.id, request.params.eventId, status);
    response.json(result);
  } catch (error) {
    next(error);
  }
};
