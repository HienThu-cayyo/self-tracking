import { defineConfig } from "eslint/config"

import webConfig from "../../apps/web/eslint.config.mjs"

export default defineConfig([
  ...webConfig,
  {
    settings: { react: { version: "19.2.8" } },
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
])
