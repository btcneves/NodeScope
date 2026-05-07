import { createContext, useContext } from 'react'
import type { Lang, Translations } from './types'
import { enUS } from './enUS'
import { ptBR } from './ptBR'

export type { Lang, Translations }
export { enUS, ptBR }
export { glossary, getGlossaryEntry } from './glossary'

const STORAGE_KEY = 'nodescope_lang'

export function getStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'pt-BR' || v === 'en-US') return v
  } catch { /* ignore */ }
  return 'en-US'
}

export function setStoredLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch { /* ignore */ }
}

export function getTranslations(lang: Lang): Translations {
  return lang === 'pt-BR' ? ptBR : enUS
}

// React context
export interface I18nContextValue {
  lang: Lang
  t: Translations
  setLang: (lang: Lang) => void
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en-US',
  t: enUS,
  setLang: () => {},
})

export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}
