import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-jade-700 text-white hover:bg-jade-800 shadow-sm',
  secondary: 'surface hover:brightness-95 dark:hover:brightness-125',
  ghost: 'hover:bg-black/5 dark:hover:bg-white/10',
  danger: 'bg-cinnabar-500 text-white hover:bg-cinnabar-600 shadow-sm',
  gold: 'bg-gold-400 text-jade-950 hover:bg-gold-500 shadow-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2 text-sm'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${sz} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface rounded-2xl p-4 shadow-sm ${className}`}>{children}</div>
}

export function Badge({ children, tone = 'jade' }: { children: ReactNode; tone?: 'jade' | 'red' | 'gold' | 'gray' }) {
  const t = {
    jade: 'bg-jade-100 text-jade-800 dark:bg-jade-900 dark:text-jade-100',
    red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    gold: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    gray: 'surface-2 text-muted',
  }[tone]
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  return (
    <div className="mb-5">
      {back && (
        <a href={back} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-jade-600 dark:text-jade-300">
          ← Indietro
        </a>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl surface-2 p-1">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition cursor-pointer ${
            o.value === value ? 'bg-jade-700 text-white shadow' : 'text-muted hover:text-current'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose?: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open || !onClose) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`surface pop-in max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {onClose && (
              <button type="button" onClick={onClose} className="rounded-full px-2 text-2xl leading-none text-muted hover:text-current cursor-pointer" aria-label="Chiudi">
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/** Pulsante a due tocchi: niente finestre di conferma del browser (bloccate nelle pagine ospitate). */
export function ConfirmButton({ label, confirmLabel, onConfirm, size = 'sm', className = '' }: { label: string; confirmLabel: string; onConfirm: () => void; size?: 'sm' | 'md'; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <Button
      size={size}
      variant={armed ? 'danger' : 'ghost'}
      className={className}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  )
}

export function Callout({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'tip' | 'warn'; title?: string }) {
  const t = {
    info: 'border-jade-300 bg-jade-50 dark:border-jade-700 dark:bg-jade-950/60',
    tip: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40',
    warn: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
  }[tone]
  return (
    <div className={`rounded-xl border-l-4 p-3 text-sm ${t}`}>
      {title && <div className="mb-1 font-bold">{title}</div>}
      {children}
    </div>
  )
}

export function useHashRoute(): string[] {
  // Percorsi semplici (#punti, #lezione-tavolo): sono gli unici che passano nei link condivisi.
  const parse = () => {
    const h = window.location.hash.replace(/^#\/?/, '')
    if (!h || h === 'home') return []
    if (h.startsWith('lezione-')) return ['lezione', h.slice('lezione-'.length)]
    return h.split('/').filter(Boolean)
  }
  const [, force] = useStateForce()
  useEffect(() => {
    const h = () => {
      force()
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [force])
  return parse()
}

import { useReducer } from 'react'
function useStateForce() {
  return useReducer((x: number) => x + 1, 0)
}
