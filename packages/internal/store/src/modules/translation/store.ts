import type { TranslationSchema } from "@follow/database/schemas/types"
import { TranslationService } from "@follow/database/services/translation"
import type { SupportedActionLanguage } from "@follow/shared"
import type { ClientTranslationLanguage } from "@follow/shared/language"
import { isClientTranslationLanguage } from "@follow/shared/language"

import { apiClient, clientTranslator } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { getEntry } from "../entry/getter"
import type { EntryTranslation, TranslationField, TranslationFieldArray } from "./types"
import { translationFields } from "./types"

type TranslationModel = Omit<TranslationSchema, "createdAt">

interface TranslationState {
  data: Record<string, Partial<Record<SupportedActionLanguage, EntryTranslation>>>
}
const defaultState: TranslationState = {
  data: {},
}

export const useTranslationStore = createZustandStore<TranslationState>("translation")(
  () => defaultState,
)

const get = useTranslationStore.getState
const set = useTranslationStore.setState
const immerSet = createImmerSetter(useTranslationStore)

class TranslationActions implements Hydratable, Resetable {
  async hydrate() {
    const translations = await TranslationService.getTranslationToHydrate()
    translationActions.upsertManyInSession(translations)
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })
    tx.persist(() => TranslationService.reset())

    await tx.run()
  }

  upsertManyInSession(translations: TranslationModel[]) {
    immerSet((state) => {
      translations.forEach((translation) => {
        if (!state.data[translation.entryId]) {
          state.data[translation.entryId] = {}
        }

        if (!state.data[translation.entryId]![translation.language]) {
          state.data[translation.entryId]![translation.language] = {
            title: null,
            description: null,
            content: null,
            readabilityContent: null,
          }
        }

        translationFields.forEach((field) => {
          if (translation[field]) {
            state.data[translation.entryId]![translation.language]![field] = translation[field]
          }
        })
      })
    })
  }

  async upsertMany(translations: TranslationModel[]) {
    this.upsertManyInSession(translations)

    await Promise.all(
      translations.map((translation) => TranslationService.insertTranslation(translation)),
    )
  }

  getTranslation(entryId: string, language: SupportedActionLanguage) {
    return get().data[entryId]?.[language]
  }
}

export const translationActions = new TranslationActions()

class TranslationSyncService {
  async generateTranslation({
    entryId,
    language,
    withContent,
    target,
    checkLanguage,
  }: {
    entryId: string
    language: SupportedActionLanguage
    withContent?: boolean
    target: "content" | "readabilityContent"
    checkLanguage: (params: { content: string; language: SupportedActionLanguage }) => boolean
  }) {
    const entry = getEntry(entryId)
    if (!entry) return
    const translationSession = translationActions.getTranslation(entryId, language)

    const fields = (
      ["title", "description", ...(withContent ? [target] : [])] as TranslationFieldArray
    ).filter((field) => {
      const content = entry[field]
      if (!content) return false

      if (translationSession?.[field]) return false

      return !checkLanguage({
        content,
        language,
      })
    })

    if (fields.length === 0) return null

    const data = isClientTranslationLanguage(language)
      ? await this.translateOnClient(
          fields.map((field) => [field, entry[field]!]),
          language,
        )
      : (
          await apiClient().ai.translation.$get({
            query: { id: entryId, language, fields: fields.join(",") },
          })
        ).data

    if (!data) return null

    const translation: TranslationModel = {
      entryId,
      language,
      title: null,
      description: null,
      content: null,
      readabilityContent: null,
    }
    fields.forEach((field) => {
      translation[field] = data[field] ?? ""
    })

    await translationActions.upsertMany([translation])
    return translation
  }

  // Returns the same shape as the server translation so the UI renders it identically
  private async translateOnClient(
    fieldContents: [TranslationField, string][],
    language: ClientTranslationLanguage,
  ) {
    const translate = clientTranslator()
    const isHTMLField = (field: TranslationField) =>
      field === "content" || field === "readabilityContent"

    const data: Partial<Record<TranslationField, string>> = {}
    const results = await Promise.all(
      [false, true].map(async (html) => {
        const group = fieldContents.filter(([field]) => isHTMLField(field) === html)
        if (group.length === 0) return true

        const texts = await translate({
          texts: group.map(([, content]) => content),
          language,
          html,
        })
        if (!texts) return false
        group.forEach(([field], index) => {
          data[field] = texts[index]
        })
        return true
      }),
    )
    return results.every(Boolean) ? data : null
  }
}

export const translationSyncService = new TranslationSyncService()
