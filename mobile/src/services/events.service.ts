import { api } from './api';

export const EVENT_CATEGORIES = ['coffee', 'pitch', 'hackathon', 'workshop', 'networking', 'other'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type AttendeeStatus = 'going' | 'interested';

export type EventOrganizer = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type EventSummary = {
  id: string;
  organizerId: string;
  organizer: EventOrganizer | null;
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  location: string;
  startsAt: string;
  capacity: number | null;
  attendeeCount: number;
  myStatus: AttendeeStatus | null;
  createdAt: string;
};

export type EventAttendee = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: AttendeeStatus;
  joinedAt: string;
};

export type EventDetail = EventSummary & { attendees: EventAttendee[] };

export type EventInputPayload = {
  title: string;
  description?: string;
  category: EventCategory;
  city?: string;
  location?: string;
  startsAt: string;
  capacity?: number | null;
};

export const listEvents = async (filters: { city?: string; category?: EventCategory } = {}) => {
  const response = await api.get<{ events: EventSummary[] }>('/events', { params: filters });
  return response.data.events;
};

export const getEvent = async (eventId: string) => {
  const response = await api.get<EventDetail>(`/events/${eventId}`);
  return response.data;
};

export const createEvent = async (payload: EventInputPayload) => {
  const response = await api.post<EventDetail>('/events', payload);
  return response.data;
};

export const updateEvent = async (eventId: string, payload: EventInputPayload) => {
  const response = await api.patch<EventDetail>(`/events/${eventId}`, payload);
  return response.data;
};

export const deleteEvent = async (eventId: string) => {
  const response = await api.delete<{ success: boolean }>(`/events/${eventId}`);
  return response.data;
};

export const setEventRsvp = async (eventId: string, status: AttendeeStatus | null) => {
  const response = await api.post<{ success: boolean; status: AttendeeStatus | null }>(
    `/events/${eventId}/rsvp`,
    { status },
  );
  return response.data;
};

// Display metadata for category chips. Mobile-only — not persisted.
export const CATEGORY_META: Record<EventCategory, { label: string; emoji: string; color: string; bg: string }> = {
  coffee: { label: 'Café', emoji: '☕', color: '#92400E', bg: 'rgba(146,64,14,0.12)' },
  pitch: { label: 'Pitch', emoji: '🚀', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  hackathon: { label: 'Hackathon', emoji: '💻', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  workshop: { label: 'Workshop', emoji: '🛠️', color: '#0F766E', bg: 'rgba(15,118,110,0.12)' },
  networking: { label: 'Networking', emoji: '🤝', color: '#DB2777', bg: 'rgba(219,39,119,0.12)' },
  other: { label: 'Otros', emoji: '📅', color: '#475569', bg: 'rgba(71,85,105,0.12)' },
};
