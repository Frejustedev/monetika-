import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Helper pour extraire une erreur de server action typée en union.
type FailState = { ok: false; error: string; field?: string };
type AnyActionState = FailState | { ok: true; [key: string]: unknown } | undefined;

export function fieldError(state: AnyActionState, field: string): string | undefined {
  if (!state || state.ok) return undefined;
  return state.field === field ? state.error : undefined;
}

export function globalError(state: AnyActionState): string | undefined {
  if (!state || state.ok) return undefined;
  return state.field ? undefined : state.error;
}
