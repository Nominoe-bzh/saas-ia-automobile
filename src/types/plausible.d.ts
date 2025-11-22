// src/types/plausible.d.ts

export {}

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, any>
      }
    ) => void
  }
}
