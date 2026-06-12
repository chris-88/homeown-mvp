import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { CookieBanner } from '@/components/shared/CookieBanner'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  subheading?: string
  children: React.ReactNode
}

export function LegalLayout({ title, lastUpdated, subheading, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subheading && <p className="mt-3 text-muted-foreground leading-relaxed">{subheading}</p>}
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
        <div className="prose-legal space-y-8 leading-relaxed text-foreground">
          {children}
        </div>
      </main>
      <PublicFooter />
      <CookieBanner />
    </div>
  )
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{heading}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  )
}

export function LegalTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} className="px-4 py-2">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
