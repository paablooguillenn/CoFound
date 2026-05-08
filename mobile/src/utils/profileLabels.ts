import { EntrepreneurLevel, Goal } from '../types/models';

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
