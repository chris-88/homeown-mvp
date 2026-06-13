import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { NumbersPreview } from '@/components/shared/NumbersPreview'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQ_PREVIEW = [
  {
    q: 'Is this rent?',
    a: 'No. The monthly service fee is not rent and there is no tenancy agreement. From day one you hold a 1% beneficial interest in the property and a contractual right to purchase it at the fixed option price.',
  },
  {
    q: 'What if I can\'t get a mortgage at the end?',
    a: 'You are not obligated to purchase. If you choose not to exercise your option, or if mortgage approval is not forthcoming, you can exit the programme with 30 days\' notice. There is no debt owed to Homeown.',
  },
  {
    q: 'Who owns the property?',
    a: 'Legal title is held by a ring-fenced Designated Activity Company, not by Homeown Limited. Homeown acts as the servicer. It manages the programme but does not own the property.',
  },
]

function FaqPreviewItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:text-foreground transition-colors"
      >
        {q}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        {/* ── Section 1: Hero ─────────────────────────────────── */}
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:min-h-[80vh] md:grid-cols-2 md:items-center md:py-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Move into your home now. Buy it in five years.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Homeown is a 60-month ownership pathway. You move in, pay a monthly service fee, and hold a 1% stake in the property from day one. At the end of the term, you have the right to purchase it at a price fixed from the start.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/calc">Check your numbers</Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Takes 2 minutes. No account needed.</p>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium text-muted-foreground">See what your numbers look like</p>
            <NumbersPreview />
          </div>
        </section>

        {/* ── Section 2: The Concept ──────────────────────────── */}
        <section className="border-t bg-muted/20 py-20">
          <div className="mx-auto max-w-2xl px-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>You pay a monthly service fee and hold a 1% beneficial interest in the property from day one.</p>
            <p>The purchase option price is fixed at the moment Homeown acquires the property, at 10% below what we paid, and does not change over the 60-month term.</p>
            <p>At the end of the term, you have the right to purchase the remaining 99% at that fixed price through a standard regulated mortgage arranged with an independent lender.</p>
            <p className="text-sm">Homeown does not provide mortgage credit. The purchase option is a right, not an obligation.</p>
          </div>
        </section>

        {/* ── Section 3: How It Works (3 steps) ──────────────── */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-12 text-2xl font-bold">How the pathway works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  n: '1',
                  title: 'Check your fit',
                  body: 'Use the calculator to see your numbers and check programme fit. It takes two minutes and tells you whether the pathway is right for your situation.',
                },
                {
                  n: '2',
                  title: 'Move in',
                  body: 'Once accepted onto the programme, our purchasing agent works with you to find the right property. Homeown acquires it, you complete your Entry Stake, and you move in.',
                },
                {
                  n: '3',
                  title: 'Buy it',
                  body: 'Over 60 months you pay the monthly service fee and hold your beneficial interest. At the end of the term, you exercise your option to purchase, or you exit. The choice is yours.',
                },
              ].map(step => (
                <div key={step.n} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Button asChild variant="outline">
                <Link to="/how-it-works">See the full pathway</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 4: The Three Numbers ───────────────────── */}
        <section className="border-t bg-muted/20 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-8 text-2xl font-bold">What the numbers look like</h2>
            <NumbersPreview defaultPrice={400000} />
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  label: 'Monthly service fee',
                  desc: 'Paid each month for the duration of the 60-month pathway. Not rent. Not a credit repayment. A service fee.',
                },
                {
                  label: 'Entry Stake',
                  desc: 'Paid once, upfront, at the start of the programme. Represents your 1% beneficial interest in the property. Equity at risk.',
                },
                {
                  label: 'Purchase option price',
                  desc: 'The fixed price at which you can buy the property at the end of the term. Set on day one. Does not change.',
                },
              ].map(item => (
                <div key={item.label}>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild>
                <Link to="/calc">Check your numbers now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 5: Structure and Protection ────────────── */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-8 text-2xl font-bold">How the structure works</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">What Homeown is not</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Homeown is not a lender. It does not provide you with credit or charge you interest. Homeown is not your landlord. The monthly service fee is not rent, and there is no tenancy agreement between you and Homeown.
                </p>
              </div>
              <div>
                <h3 className="mb-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">What protects you</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The property is held in a ring-fenced Designated Activity Company, a separate legal entity established specifically for each property cohort. Your beneficial interest and your option to purchase are governed by a legally binding agreement. The purchase option price is contractually fixed from the moment of acquisition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: FAQ Preview ──────────────────────────── */}
        <section className="border-t bg-muted/20 py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-8 text-2xl font-bold">Common questions</h2>
            <div className="divide-y rounded-xl border bg-card px-6">
              {FAQ_PREVIEW.map(item => (
                <FaqPreviewItem key={item.q} {...item} />
              ))}
            </div>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link to="/faq">See all questions</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 7: Final CTA ───────────────────────────── */}
        <section className="bg-foreground py-20 text-background">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-2xl font-bold">Ready to see if the programme is right for you?</h2>
            <p className="mt-4 text-background/70">Check your numbers in two minutes. No account, no commitment.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/calc">Check your numbers</Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
