/**
 * Returns a human-readable presence string and whether the user is currently online,
 * based on `last_seen_at`. We consider a user "online" when active in the last 5 minutes.
 */
export const formatPresence = (lastSeenAt: string | Date | null | undefined): { label: string; online: boolean } => {
  if (!lastSeenAt) return { label: 'Sin actividad reciente', online: false };

  const now = Date.now();
  const last = new Date(lastSeenAt).getTime();
  const diffMs = now - last;

  if (diffMs < 5 * 60 * 1000) return { label: 'En línea', online: true };

  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return { label: `Activo hace ${diffMin} min`, online: false };

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return { label: `Activo hace ${diffHours} h`, online: false };

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { label: 'Activo hace 1 día', online: false };
  if (diffDays < 7) return { label: `Activo hace ${diffDays} días`, online: false };

  return { label: 'Sin actividad reciente', online: false };
};
