import { EntrepreneurLevel, Goal } from '../types/models';

// Marker pill name used at the end of every selectable list. When the user
// taps it we expose an inline TextInput so they can type custom values not
// included in the predefined catalogue.
export const OTHER_OPTION = 'Otras';

// Catálogo único de habilidades disponibles. Compartido por el wizard de
// creación de perfil y la edición desde Profile. La opción "Otras" siempre
// aparece la última y abre un input para que el usuario añada las suyas.
export const SKILL_OPTIONS = [
  'Marketing Digital', 'Programación', 'Diseño UX/UI', 'Ventas',
  'Finanzas', 'Desarrollo Web', 'Gestión de Proyectos', 'SEO/SEM',
  'Redes Sociales', 'Copywriting', 'Análisis de Datos', 'E-commerce',
  'Networking', 'Estrategia de Negocio', 'Desarrollo Móvil',
  'Blockchain', 'Inteligencia Artificial', 'Producción de Video',
  OTHER_OPTION,
];

// Áreas de interés / sectores. Igual que SKILL_OPTIONS, terminan con "Otras".
export const INTEREST_AREAS = [
  'Tecnología', 'E-commerce', 'Servicios', 'SaaS', 'Marketing',
  'Educación', 'Salud', 'Fintech', 'Sostenibilidad', 'Entretenimiento',
  OTHER_OPTION,
];

/**
 * Splits a comma-separated string of custom values into a clean array.
 * Used when the user types extra skills/interests under "Otras".
 */
export const parseCustomList = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 60);

export const LEVEL_META: Record<EntrepreneurLevel, { label: string; color: string; bg: string; icon: string }> = {
  principiante: { label: 'Principiante', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)', icon: 'leaf' },
  intermedio: { label: 'Intermedio', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', icon: 'flame' },
  avanzado: { label: 'Avanzado', color: '#F472B6', bg: 'rgba(244,114,182,0.15)', icon: 'trophy' },
};

export const GOAL_META: Record<Goal, { label: string; short: string; color: string; bg: string; icon: string }> = {
  learn_skill: {
    label: 'Aprender una skill',
    short: 'Aprender',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.15)',
    icon: 'school',
  },
  find_partner: {
    label: 'Buscar socio',
    short: 'Socio',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.15)',
    icon: 'people',
  },
  networking: {
    label: 'Networking ambicioso',
    short: 'Networking',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    icon: 'rocket',
  },
};

export const LEVEL_OPTIONS: { value: EntrepreneurLevel; title: string; description: string; icon: string }[] = [
  {
    value: 'principiante',
    title: 'Principiante',
    description: 'Estoy explorando mis primeras ideas y aprendiendo lo básico.',
    icon: 'leaf',
  },
  {
    value: 'intermedio',
    title: 'Intermedio',
    description: 'Tengo experiencia validando ideas y ya he lanzado algo.',
    icon: 'flame',
  },
  {
    value: 'avanzado',
    title: 'Avanzado',
    description: 'He liderado proyectos hasta producción / facturación o equipos.',
    icon: 'trophy',
  },
];

export const GOAL_OPTIONS: { value: Goal; title: string; description: string; icon: string }[] = [
  {
    value: 'learn_skill',
    title: 'Aprender una skill',
    description: 'Quiero mejorar en algo concreto y conocer gente que me enseñe.',
    icon: 'school',
  },
  {
    value: 'find_partner',
    title: 'Buscar socio para un proyecto',
    description: 'Tengo una idea y necesito gente complementaria para arrancar.',
    icon: 'people',
  },
  {
    value: 'networking',
    title: 'Networking ambicioso',
    description: 'Quiero rodearme de gente con mentalidad emprendedora, sin proyecto fijo.',
    icon: 'rocket',
  },
];
