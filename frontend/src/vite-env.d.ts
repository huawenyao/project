/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_SENTRY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}