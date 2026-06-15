import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { DualComparisonWidget } from '@/components/shared/DualComparisonWidget'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'

const RECOGNITION = [
  'I can afford the monthly cost. I cannot save the upfront amount.',
  'Every time I get close, the price moves again.',
  'My bank will approve the mortgage. The deposit is the part I can never get ahead of.',
  'I have been searching for years. I am further away now than when I started.',
]

const PROTECTION_CARDS = [
  {
    heading: 'Your option price is fixed in writing on the day of acquisition',
    body: "The purchase option price is set at the moment Homeown acquires the property and written into your pathway agreement before you move in. It is 10% below what Homeown paid. It does not move with the market over the 60-month term.",
  },
  {
    heading: 'The property is legally ring-fenced',
    body: "Legal title to the property is held by a Designated Activity Company (DAC) set up specifically for your property cohort. Homeown Limited does not hold legal title and cannot deal with the property outside the programme governance. The DAC's sole purpose is to hold the asset and discharge its obligations under the pathway agreements.",
  },
  {
    heading: 'You hold a beneficial interest from day one',
    body: "From the moment you complete your Entry Stake, you hold a 1% beneficial interest in the property. This is not a tenancy. There is no landlord-tenant relationship between you and Homeown. Your beneficial interest and your option to purchase are governed by a legally binding agreement.",
  },
  {
    heading: 'No debt between you and Homeown',
    body: "You owe nothing to Homeown at any point in the programme. There is no amortisation schedule and no interest charge. The monthly service fee is a service fee, not a credit repayment. If you exit, you leave with no obligation to Homeown.",
  },
]

const STAGE_ALERT = 'These checks confirm you meet the programme participation criteria and that payments are operationally feasible. Homeown does not assess mortgage affordability or creditworthiness at entry. Mortgage assessment is completed only by an independent regulated lender at exit.'

const STAGES = [
  {
    n: 1,
    heading: 'Check your fit',
    body: 'The calculator checks one thing: whether the property price you are targeting is within range for a regulated mortgage at the end of the 60-month term. It uses standard Irish mortgage lending parameters. It is not a credit assessment. It does not determine whether you can afford the monthly service fee, which is your decision.',
    alert: null as string | null,
  },
  {
    n: 2,
    heading: 'A conversation about fit',
    body: 'If the calculator shows programme fit, a 20-minute discovery call follows. This is a structured conversation to confirm the programme is right for your situation. It is not a sales call. After the call, you submit a standard set of documents to verify income and confirm payment operability. No credit check is run.',
    alert: STAGE_ALERT,
  },
  {
    n: 3,
    heading: 'The property search',
    body: "Ireland's property market is supply-constrained. Finding the right property takes time. Once accepted onto the programme, a Homeown purchasing agent works with you on the search. Most participants search for several months before identifying a suitable property. When a property passes the go/no-go review, Homeown proceeds to acquire it through a ring-fenced Designated Activity Company. You pay your Entry Stake at sale agreed stage, establishing your beneficial interest.",
    alert: null as string | null,
  },
  {
    n: 4,
    heading: 'Move in and the 60-month pathway',
    body: 'On completion, you move in. Your monthly service fee (Domiter) begins on the first day of the following month. Your option price was fixed on the day of acquisition, set at 10% below what Homeown paid. It does not change over the 60-month term regardless of what happens to property values in the market.',
    alert: null as string | null,
  },
  {
    n: 5,
    heading: 'Your option window',
    body: 'In the final 30 days of the term, your option window opens. You can exercise your option to purchase the property at the fixed option price by arranging a regulated mortgage through an independent lender of your choice. Or you can choose not to exercise your option and exit. If you exit: 30 days notice. No debt owed to Homeown. Your Entry Stake is equity at risk and is not returned as cash.',
    alert: null as string | null,
  },
]

const FAQ_ITEMS = [
  {
    q: 'Is this the same as renting?',
    a: 'No. There is no tenancy agreement and no landlord-tenant relationship. From the day you complete your Entry Stake, you hold a beneficial interest in the property and a contractual right to purchase it at the fixed option price. The monthly service fee is not rent. It is the service fee for operating the pathway.',
  },
  {
    q: 'What if I cannot get a mortgage at the end of the term?',
    a: 'The option to purchase is a right, not an obligation. If mortgage approval is not available to you at the end of the term, you are not forced to complete the purchase. You can exit with 30 days notice. There is no debt owed to Homeown. Your Entry Stake is equity at risk.',
  },
  {
    q: 'Who actually owns the property?',
    a: 'Legal title is held by a ring-fenced Designated Activity Company, a separate legal entity established specifically for your property cohort. Homeown Limited manages the programme as servicer but does not hold legal title and is not your landlord.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        {/* ── Section 1: Hero ───────────────────────────────────────── */}
        <section className="min-h-[85vh] md:min-h-screen flex flex-col justify-center border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-0 grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                Homeown
              </p>
              <h1 className="text-5xl font-normal tracking-tight sm:text-6xl lg:text-[4rem] leading-[1.06] max-w-xl">
                You can afford the home. The deposit is what's stopping you.
              </h1>
              <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-md">
                Homeown is a 60-month structured pathway to homeownership. You move in, pay a monthly service fee, and hold a contractual right to purchase the property at a price fixed from the day of acquisition.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/calc">Check your numbers</Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Two minutes. No account required.</p>
            </div>
            <div>
              <DualComparisonWidget />
            </div>
          </div>
          <div id="nav-sentinel" />
        </section>

        {/* ── Section 2: Recognition ────────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-10">
              The Problem
            </p>
            <div className="space-y-8">
              {RECOGNITION.map(statement => (
                <p key={statement} className="text-xl font-medium leading-snug md:text-2xl">
                  {statement}
                </p>
              ))}
            </div>
            <p className="mt-10 text-muted-foreground">
              If any of these are true, the Homeown pathway may apply to you.
            </p>
            <Link
              to="/calc"
              className="mt-4 inline-block text-sm font-medium text-brand-green underline underline-offset-4 hover:text-brand-green-light transition-colors"
            >
              Check whether you qualify
            </Link>
          </div>
        </section>

        {/* ── Section 3: Numbers ───────────────────────────────────── */}
        <section className="border-b py-20 md:py-28 bg-muted/20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl font-normal md:text-4xl mb-3">
              What would it actually cost?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-xl">
              Adjust the property price to see your numbers. The comparison on the right shows how long it would take to save a traditional 10% deposit at the same monthly amount.
            </p>
            <DualComparisonWidget />
            <p className="mt-4 text-xs text-muted-foreground">
              These figures are illustrative. The full programme fit assessment, including exit mortgage plausibility, is completed in the calculator.
            </p>
            <Button asChild className="mt-6">
              <Link to="/calc">Check your full numbers</Link>
            </Button>
          </div>
        </section>

        {/* ── Section 4: Pathway (5 stages) ────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-normal md:text-4xl mb-2">
              What actually happens
            </h2>
            <p className="text-muted-foreground mb-14">
              Five stages, over five years. Buying a home is not simple. We do not pretend otherwise.
            </p>

            {/* Desktop: 5-column grid */}
            <div className="hidden md:grid md:grid-cols-5 md:gap-5">
              {STAGES.map((stage, i) => (
                <div key={stage.n}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary text-xs font-bold text-primary">
                      {stage.n}
                    </span>
                    {i < STAGES.length - 1 && <div className="flex-1 h-px bg-border" />}
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{stage.heading}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stage.body}</p>
                  {stage.alert && (
                    <Alert className="mt-3">
                      <AlertDescription className="text-xs">{stage.alert}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: vertical stack */}
            <div className="space-y-10 md:hidden">
              {STAGES.map(stage => (
                <div key={stage.n} className="flex gap-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
                    {stage.n}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{stage.heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{stage.body}</p>
                    {stage.alert && (
                      <Alert className="mt-4">
                        <AlertDescription className="text-sm">{stage.alert}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link
                to="/how-it-works"
                className="text-sm font-medium text-brand-green underline underline-offset-4 hover:text-brand-green-light transition-colors"
              >
                Full pathway detail and all stages
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 5: Protection ────────────────────────────────── */}
        <section className="border-b py-20 md:py-28 bg-muted/20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl font-normal md:text-4xl mb-12">
              The structure is designed to protect you.
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {PROTECTION_CARDS.map(card => (
                <div key={card.heading} className="rounded-xl border bg-card p-6">
                  <div className="w-5 h-0.5 bg-brand-green mb-4" />
                  <h3 className="font-semibold mb-2">{card.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 6: FAQ Preview ───────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-normal md:text-4xl mb-10">
              The questions people ask first.
            </h2>
            <Accordion type="single" collapsible className="divide-y border-y">
              {FAQ_ITEMS.map(item => (
                <AccordionItem key={item.q} value={item.q} className="border-none">
                  <AccordionTrigger className="text-left font-medium py-5 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-8">
              <Button asChild variant="secondary">
                <Link to="/faq">All questions</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 7: Final CTA ─────────────────────────────────── */}
        <section className="bg-primary py-24 md:py-32">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-4xl font-normal text-primary-foreground md:text-5xl leading-tight">
              Ready to see if the programme fits?
            </h2>
            <p className="mt-5 text-primary-foreground/70 text-lg">
              The calculator takes two minutes. No account. No commitment.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-10 bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-auto px-8 py-4 text-base"
            >
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
