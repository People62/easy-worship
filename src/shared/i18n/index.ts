import { EN, type MessageKey } from './en'

// Interface language. Indonesian is the source language: every message is
// written in Indonesian in the code and is its own key, so the Indonesian
// UI needs no dictionary. en.ts maps each key to English, and TypeScript
// rejects a t() call whose key has no English entry.

export type Language = 'id' | 'en'
export type { MessageKey }

export const LANGUAGES: ReadonlyArray<{ value: Language; label: string }> = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' }
]

export const DEFAULT_LANGUAGE: Language = 'id'

export function isLanguage(value: unknown): value is Language {
  return value === 'id' || value === 'en'
}

// One language per process: the main process follows the settings, and
// each window sets it before rendering.
let current: Language = DEFAULT_LANGUAGE

export function setLanguage(language: Language): void {
  current = language
}

export function getLanguage(): Language {
  return current
}

// Locale for dates and numbers.
export function locale(language: Language = current): string {
  return language === 'en' ? 'en-GB' : 'id-ID'
}

export type MessageParams = Record<string, string | number>

// "Hapus {title}?" with { title: 'Haleluya' } → "Hapus Haleluya?"
export function format(template: string, params?: MessageParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

export function translate(language: Language, key: MessageKey, params?: MessageParams): string {
  return format(language === 'en' ? EN[key] : key, params)
}

export function t(key: MessageKey, params?: MessageParams): string {
  return translate(current, key, params)
}
