import type { ReactNode } from 'react'

interface Props {
  title: string
  version: string
  generatedDate?: string
  children: ReactNode
}

export function DocumentLayout({ title, version, generatedDate, children }: Props) {
  const date = generatedDate ?? new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto font-sans text-foreground bg-background min-h-screen p-6 print:p-0 print:bg-white">
      <div className="bg-card rounded-lg shadow-sm print:shadow-none">
        {/* Header */}
        <div className="px-10 py-6 border-b border-primary/20">
          <div className="flex items-start justify-between gap-4">
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" aria-label="Homeown">
              <text x="0" y="22" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#123A28">Homeown</text>
            </svg>
            <div className="text-right text-xs text-foreground/50">
              <div className="font-medium">{title}</div>
              <div>Version {version}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-10 py-8 space-y-6 text-[15px] leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        <div className="px-10 py-5 border-t border-primary/20 text-xs text-foreground/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Homeown Limited &nbsp;|&nbsp; support@homeown.ie &nbsp;|&nbsp; complaints@homeown.ie</span>
          <span>Generated {date}. Part of your Homeown programme record.</span>
        </div>
      </div>
    </div>
  )
}

// Shared styled elements used across templates

export function DocH1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-semibold text-primary leading-snug">{children}</h1>
}

export function DocH2({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mt-6 mb-2">{children}</h2>
}

export function DocP({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed">{children}</p>
}

export function DocCallout({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-4 border-primary pl-4 py-1 bg-brand-green-muted rounded-r text-sm">
      {children}
    </div>
  )
}

export function DocWarning({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-4 border-brand-burgundy pl-4 py-1 bg-brand-burgundy/5 rounded-r text-sm">
      {children}
    </div>
  )
}

export function DocTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-sm border-collapse">
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i} className="border-b border-border last:border-0">
            <td className="py-2 pr-4 text-foreground/60 font-medium w-1/2">{label}</td>
            <td className="py-2 font-medium">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function DocList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-1 text-sm">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export function DocFootnote({ children }: { children: ReactNode }) {
  return <p className="text-xs text-foreground/50 italic border-t border-border pt-4 mt-4">{children}</p>
}
