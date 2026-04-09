import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBool(val?: any): boolean {
  if (val === true || val === "1" || val === 1 || val === "true" || val === "TRUE") return true;
  return false;
}

export function formatContainerNumber(raw: string): string {
  if (!raw) return "";
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // AAAA 111111-1
  if (clean.length === 11 && /^[A-Z]{4}/.test(clean) && /^[0-9]{7}$/.test(clean.substring(4))) {
    return `${clean.substring(0, 4)} ${clean.substring(4, 10)}-${clean.substring(10)}`;
  }
  return raw.toUpperCase();
}

/**
 * Convierte un texto a mayúsculas preservando caracteres especiales 
 * que normalmente se alterarían (ej. la ß alemana no se debe convertir a SS).
 */
export function safeToUpperCase(str: string): string {
  if (!str) return "";
  return str.split('').map(char => {
    if (char === 'ß') return 'ß';
    return char.toUpperCase();
  }).join('');
}
