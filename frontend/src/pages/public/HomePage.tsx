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
    a: 'No. The monthly service fee is not rent and there is no tenancy agreement. From day one you own a 1% share of the property (a beneficial interest) and have a legally binding right to buy the rest at the agreed price.',
  },
  {
    q: 'What if I can\'t get a mortgage at the end?',
    a: 'You are not obligated to buy. If you choose not to, or if mortgage approval isn\'t available at that point, you exit with 30 days\' notice. There is no debt owed to Homeown.',
  },
  {
    q: 'Who owns the property?',
    a: 'Legal title is held by a separate company set up specifically for your property (a Designated Activity Company). Homeown acts as the manager of the programme. It does not own the property.',
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
            <h1 className="text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
              Move into your home now. Buy it in five years.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Homeown is a 60-month pathway to homeownership. You move in, pay a fixed monthly fee, and own a 1% share of the property from day one. At the end of the term, you buy the rest at a price agreed before you moved in.
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
        <section className="border-t bg-muted/20 py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>From the moment you move in, you own a 1% share of the property. You pay a fixed monthly fee for 60 months: not rent, not a mortgage repayment.</p>
            <p>Before we buy the property, we agree a fixed purchase price with you: 10% below what Homeown paid. That price is locked in writing and does not change over the 60-month term, no matter what happens to the market.</p>
            <p>At month 60, you arrange a standard mortgage with any bank of your choice and complete the purchase. Or you walk away, with no debt and no penalty.</p>
            <p className="text-sm">Homeown does not lend money and does not charge interest. The purchase option is a right, not an obligation.</p>
          </div>
        </section>

        {/* ── Section 3: How It Works (3 steps) ──────────────── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <h2 className="mb-12 text-2xl font-normal tracking-tight">How the pathway works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  n: '1',
                  title: 'Check your fit',
                  body: 'Use the calculator to see your three numbers: the monthly fee, the upfront entry stake, and your fixed purchase price. It takes two minutes and tells you whether the pathway fits your situation.',
                },
                {
                  n: '2',
                  title: 'Move in',
                  body: 'Once accepted, we work with you to find the right property. We buy it through a separate ring-fenced company, you pay your 1% entry stake, and you move in with full ownership rights from day one.',
                },
                {
                  n: '3',
                  title: 'Buy it',
                  body: 'Over 60 months you pay the monthly fee and your ownership share stays in place. At the end of the term, arrange a mortgage and buy your home at the agreed price, or walk away. The choice is yours.',
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
        <section className="border-t bg-muted/20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <h2 className="mb-8 text-2xl font-normal tracking-tight">What the numbers look like</h2>
            <NumbersPreview defaultPrice={400000} />
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  label: 'Monthly service fee',
                  desc: 'Your fixed monthly payment for 60 months. Not rent. Not a mortgage repayment. A fee for operating the pathway, the same amount every month for the full term.',
                },
                {
                  label: 'Entry Stake',
                  desc: 'Paid once when you move in. This is your 1% share of the property from day one. It is equity in the property, not a deposit. It is at risk if you choose to exit before the term ends.',
                },
                {
                  label: 'Purchase option price',
                  desc: 'The price you pay to complete the purchase at the end of 60 months. Agreed before you move in, written into the contract, and fixed for the duration. It does not change.',
                },
              ].map(item => (
                <div key={item.label}>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to="/calc">Check your numbers now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 5: Structure and Protection ────────────── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <h2 className="mb-8 text-2xl font-normal tracking-tight">How the structure works</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">What Homeown is not</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Homeown is not a lender. It does not give you money or charge you interest. Homeown is not your landlord. There is no tenancy agreement between you and Homeown, and the monthly fee is not rent.
                </p>
              </div>
              <div>
                <h3 className="mb-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">What protects you</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The property is held in a separate company (a Designated Activity Company) set up specifically for your property. Your ownership share and your right to purchase are governed by a legally binding agreement. The purchase price is fixed in that agreement from the moment the property is bought.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: FAQ Preview ──────────────────────────── */}
        <section className="border-t bg-muted/20 py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <h2 className="mb-8 text-2xl font-normal tracking-tight">Common questions</h2>
            <div className="divide-y rounded border bg-card px-6">
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
        <section className="bg-brand-green py-20 text-brand-cream">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-2xl font-normal">Ready to see if the programme is right for you?</h2>
            <p className="mt-4 text-brand-cream/70">Check your numbers in two minutes. No account, no commitment.</p>
            <Button asChild size="lg" className="mt-8 bg-brand-cream text-brand-green hover:bg-brand-cream/90">
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
