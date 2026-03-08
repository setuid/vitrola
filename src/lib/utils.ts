import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatYear(year: number | null): string {
  return year ? String(year) : '—'
}

export function getConditionColor(condition: string): string {
  const map: Record<string, string> = {
    M: '#4CC97A',
    'NM-': '#4CC97A',
    'VG+': '#C9A84C',
    VG: '#E8B84B',
    G: '#C94C4C',
  }
  return map[condition] || '#9A9080'
}

export const OCCASIONS = [
  'Jantar',
  'Festa',
  'Relaxar',
  'Trabalho',
  'Manhã',
  'Noite',
  'Fim de semana',
  'Outro',
] as const

export const CONDITIONS = ['M', 'NM-', 'VG+', 'VG', 'G+', 'G', 'F', 'P'] as const

export const RPMS = [33, 45, 78] as const
