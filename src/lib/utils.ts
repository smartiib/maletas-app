
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple currency formatter (BRL by default)
export function formatCurrency(value: number | string | null | undefined, locale: string = 'pt-BR', currency: string = 'BRL') {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const safe = isNaN(Number(num)) ? 0 : Number(num);
  return safe.toLocaleString(locale, { style: 'currency', currency });
}
