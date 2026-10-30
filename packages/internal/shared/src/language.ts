import type { z } from "zod"

import type { languageSchema } from "./hono"

export type ServerActionLanguage = z.infer<typeof languageSchema>

// Languages the Folo AI endpoints don't accept; their translations are done on the client with DeepL
export const CLIENT_TRANSLATION_LANGUAGES = ["tr"] as const
export type ClientTranslationLanguage = (typeof CLIENT_TRANSLATION_LANGUAGES)[number]

export type SupportedActionLanguage = ServerActionLanguage | ClientTranslationLanguage
export const ACTION_LANGUAGE_MAP: Record<
  SupportedActionLanguage,
  {
    label: string
    value: string
    code?: string
  }
> = {
  // keep-sorted
  en: {
    label: "English",
    value: "en",
    code: "eng",
  },
  "zh-CN": {
    code: "cmn",
    label: "Simplified Chinese",
    value: "zh-CN",
  },
  "zh-TW": {
    label: "Traditional Chinese (Taiwan)",
    value: "zh-TW",
  },
  ja: {
    label: "Japanese",
    value: "ja",
    code: "jpn",
  },
  tr: {
    label: "Turkish",
    value: "tr",
    code: "tur",
  },
}
export const ACTION_LANGUAGE_KEYS = Object.keys(ACTION_LANGUAGE_MAP) as SupportedActionLanguage[]

// UI languages without AI support fall back to English
export const toSupportedActionLanguage = (language: string): SupportedActionLanguage =>
  ACTION_LANGUAGE_KEYS.includes(language as SupportedActionLanguage)
    ? (language as SupportedActionLanguage)
    : "en"

export const isClientTranslationLanguage = (
  language: SupportedActionLanguage,
): language is ClientTranslationLanguage =>
  (CLIENT_TRANSLATION_LANGUAGES as readonly string[]).includes(language)

// Server-side AI actions (e.g. summary) fall back to English for client-only languages
export const toServerActionLanguage = (language: SupportedActionLanguage): ServerActionLanguage =>
  isClientTranslationLanguage(language) ? "en" : language
