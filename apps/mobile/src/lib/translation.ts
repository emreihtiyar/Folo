import type { SupportedActionLanguage } from "@follow/shared"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"
import { isClientTranslationLanguage } from "@follow/shared/language"
import { duplicateIfLengthLessThan } from "@follow/utils"
import { parseHtml } from "@follow/utils/html"
import { franc } from "franc-min"

export const checkLanguage = ({
  content,
  language,
}: {
  content: string
  language: SupportedActionLanguage
}) => {
  if (!content) return true
  const pureContent = parseHtml(content)
    .toText()
    .replaceAll(/https?:\/\/\S+|www\.\S+/g, " ")
  const { code } = ACTION_LANGUAGE_MAP[language]
  if (!code) {
    return false
  }

  // Restricting franc to a single Latin-script language makes it match any Latin text,
  // so client-translated languages (e.g. tr) need full detection
  const sourceLanguage = franc(
    duplicateIfLengthLessThan(pureContent, 20),
    isClientTranslationLanguage(language) ? undefined : { only: [code] },
  )

  return sourceLanguage === code
}
