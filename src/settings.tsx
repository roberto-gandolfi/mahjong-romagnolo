import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'auto' | 'light' | 'dark'
interface Settings {
  showLabels: boolean
  theme: Theme
  set: (patch: Partial<Omit<Settings, 'set'>>) => void
}

const KEY = 'mjr-settings'
const defaults = { showLabels: true, theme: 'auto' as Theme }

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

const Ctx = createContext<Settings>({ ...defaults, set: () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch {
      /* archiviazione non disponibile */
    }
    const root = document.documentElement
    if (s.theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', s.theme)
  }, [s])
  return <Ctx.Provider value={{ ...s, set: (p) => setS((x: typeof s) => ({ ...x, ...p })) }}>{children}</Ctx.Provider>
}

export const useSettings = () => useContext(Ctx)

/** Piccolo helper per salvare stato nel browser con fallback sicuro. */
export function usePersistent<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* ignora */
    }
  }, [key, v])
  return [v, setV] as const
}
