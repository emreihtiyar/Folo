import { createDeepLTranslator } from "@follow/store/translation/client-translator"

import { getGeneralSettings } from "../atoms/settings/general"

export const clientTranslator = createDeepLTranslator({
  getApiKey: () => getGeneralSettings().deeplApiKey,
  request: async (url, { headers, body }) => {
    const res = await fetch(url, { method: "POST", headers, body })
    return { ok: res.ok, status: res.status, text: await res.text() }
  },
})
