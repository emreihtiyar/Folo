import { IN_ELECTRON } from "@follow/shared/constants"
import { createDeepLTranslator } from "@follow/store/translation/client-translator"

import { getGeneralSettings } from "~/atoms/settings/general"
import { BrowserFetchAdapter, ElectronFetchAdapter } from "~/modules/integration/fetch-adapter"

// DeepL rejects browser requests, so in Electron they go through the main process
const fetchAdapter = IN_ELECTRON ? new ElectronFetchAdapter() : new BrowserFetchAdapter()

export const clientTranslator = createDeepLTranslator({
  getApiKey: () => getGeneralSettings().deeplApiKey,
  request: async (url, { headers, body }) => {
    const res = await fetchAdapter.fetch(url, { method: "POST", headers, body, timeout: 60_000 })
    return { ok: res.ok, status: res.status, text: res.text ?? "" }
  },
})
