import type { ClientTranslationLanguage } from "@follow/shared/language"

export type ClientTranslator = (params: {
  texts: string[]
  language: ClientTranslationLanguage
  html: boolean
  // Resolves to null when the translator isn't configured
}) => Promise<string[] | null>

export type ClientTranslatorRequest = (
  url: string,
  init: { headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; text: string }>

const DEEPL_TARGET_LANGUAGE: Record<ClientTranslationLanguage, string> = {
  tr: "TR",
}

/**
 * DeepL rejects browser (CORS) requests, so each platform passes a `request`
 * that can reach the API directly, e.g. through the Electron main process.
 */
export const createDeepLTranslator =
  ({
    getApiKey,
    request,
  }: {
    getApiKey: () => string
    request: ClientTranslatorRequest
  }): ClientTranslator =>
  async ({ texts, language, html }) => {
    const apiKey = getApiKey().trim()
    if (!apiKey) return null
    // Free plan keys end with ":fx" and use a separate host
    const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com"

    const res = await request(`https://${host}/v2/translate`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texts,
        target_lang: DEEPL_TARGET_LANGUAGE[language],
        ...(html && { tag_handling: "html" }),
      }),
    })
    if (!res.ok) {
      throw new Error(`DeepL request failed with status ${res.status}`)
    }

    const { translations } = JSON.parse(res.text) as { translations: { text: string }[] }
    return translations.map((translation) => translation.text)
  }
