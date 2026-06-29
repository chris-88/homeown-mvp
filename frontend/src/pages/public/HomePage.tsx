import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Shield, Home, CheckCircle2, Info } from 'lucide-react'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { TheTurnSection } from '@/components/shared/TheTurnSection'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Button } from '@/components/ui/button'
import { track, buildCalcUrl } from '@/lib/analytics'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const HOOK_HEADLINES: Record<string, string> = {
  default:    "You can afford the home. The deposit is what's stopping you.",
  'rent-trap': 'Your monthly payment leaves. Every month. None of it goes toward the home.',
  'twin-cost': 'You pay for housing. You save for a deposit. One Homeown payment can replace both.',
  fairness:   'You built this without help. Homeown is built for that.',
  futility:   'The deposit target keeps moving. Homeown fixes the price from today.',
}

const RECOGNITION = [
  'I can afford the monthly cost. I cannot save the upfront amount.',
  'Every time I get close, the price moves again.',
  'My bank will approve the mortgage. The deposit is the part I can never get ahead of.',
  'I have been searching for years. I am further away now than when I started.',
]

function RecognitionStack() {
  return (
    <div className="space-y-8">
      {RECOGNITION.map(text => (
        <p key={text} className="text-xl font-medium leading-snug md:text-2xl text-brand-ink">
          {text}
        </p>
      ))}
    </div>
  )
}

const STAGE_INFO = 'These checks confirm you meet the programme participation criteria and that payments are operationally feasible. Homeown does not assess mortgage affordability or creditworthiness at entry. Mortgage assessment is completed only by an independent regulated lender at exit.'

const STAGES = [
  {
    n: 1,
    heading: 'Check your fit',
    body: 'Whether the price you are targeting is within range for a regulated mortgage at the end of the term. Not a credit assessment.',
    info: null as string | null,
  },
  {
    n: 2,
    heading: 'A conversation about fit',
    body: 'A 20-minute call to confirm programme fit. You submit standard income documents. No credit check.',
    info: STAGE_INFO,
  },
  {
    n: 3,
    heading: 'The property search',
    body: 'A purchasing agent works with you on the search. When a property passes review, Homeown acquires it. You pay your Entry Stake at sale agreed.',
    info: null as string | null,
  },
  {
    n: 4,
    heading: 'Move in and the 60-month pathway',
    body: 'You move in. Monthly service fee begins. Your purchase option price was fixed at acquisition — it does not change.',
    info: null as string | null,
  },
  {
    n: 5,
    heading: 'Your option window',
    body: 'Exercise your option to purchase at the fixed price via a regulated mortgage. Or exit with 30 days notice. No debt owed to Homeown.',
    info: null as string | null,
  },
]

const PROTECTION_CARDS = [
  {
    Icon: Lock,
    heading: 'Your option price is fixed in writing on the day of acquisition',
    body: "Set at acquisition and written into your agreement before you move in. 10% below what Homeown paid. Fixed for the full 60-month term.",
  },
  {
    Icon: Shield,
    heading: 'The property is legally ring-fenced',
    body: "Legal title is held by a ring-fenced DAC set up for your cohort only. Homeown does not hold legal title and cannot deal with the property outside the programme.",
  },
  {
    Icon: Home,
    heading: 'You hold a beneficial interest from day one',
    body: "From the moment you complete your Entry Stake, you hold a 1% beneficial interest in the property. Not a tenancy. Governed by a legally binding agreement.",
  },
  {
    Icon: CheckCircle2,
    heading: 'No debt between you and Homeown',
    body: "Nothing owed to Homeown at any point. No amortisation, no interest. If you exit, you leave with no obligation.",
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

function StageInfoDialog({ text }: { text: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
          <Info className="h-3.5 w-3.5" />
          Programme criteria
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Programme participation criteria</DialogTitle>
          <DialogDescription className="leading-relaxed pt-2">
            {text}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function StageCard({ stage, small = false }: { stage: typeof STAGES[0]; small?: boolean }) {
  return (
    <div>
      <h3 className={cn('font-semibold mb-2', small ? 'text-sm' : '')}>{stage.heading}</h3>
      <p className={cn('text-muted-foreground leading-relaxed', small ? 'text-xs' : 'text-sm')}>
        {stage.body}
      </p>
      {stage.info && <StageInfoDialog text={stage.info} />}
    </div>
  )
}

export default function HomePage() {
  const [headline, setHeadline] = useState(HOOK_HEADLINES.default)
  const heroRef = useRef<HTMLElement>(null)
  const heroViewFired = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const knownHooks = ['rent-trap', 'twin-cost', 'fairness', 'futility']
    const hookParam = params.get('hook') ?? ''
    const resolvedHook = knownHooks.includes(hookParam) ? hookParam : 'default'
    sessionStorage.setItem('homeown_hook', resolvedHook)
    setHeadline(HOOK_HEADLINES[resolvedHook])

    const utm: Record<string, string> = {}
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const val = params.get(key)
      if (val) utm[key] = val
    })
    if (Object.keys(utm).length) {
      sessionStorage.setItem('homeown_utm', JSON.stringify(utm))
    }

    if (!sessionStorage.getItem('homeown_session_id')) {
      sessionStorage.setItem('homeown_session_id', crypto.randomUUID())
    }
  }, [])

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !heroViewFired.current) {
          heroViewFired.current = true
          track('homepage_hero_view')
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const calcUrl = buildCalcUrl()

  function handleHeroCtaClick() {
    track('hero_cta_click', {})
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        {/* ── Section 1: Hero ───────────────────────────────────────── */}
        <section ref={heroRef} className="min-h-[85vh] md:min-h-screen flex flex-col justify-center border-b">
          <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
            <p className="text-xs font-medium tracking-widest text-brand-taupe uppercase mb-6">Homeown</p>
            <h1 className="text-5xl font-normal tracking-tight sm:text-6xl lg:text-[4rem] leading-[1.06]">
              {headline}
            </h1>
            <p className="mt-6 text-base text-brand-taupe leading-relaxed max-w-xl mx-auto">
              Move in, pay a monthly service fee, and hold the right to buy at a price fixed from day one.
            </p>
            <div className="mt-10">
              <Link
                to={calcUrl}
                onClick={handleHeroCtaClick}
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Check your numbers
              </Link>
              <p className="mt-3 text-xs text-brand-taupe">Two minutes. No account required.</p>
            </div>
          </div>
          <div id="nav-sentinel" />
        </section>

        {/* ── Section 2: Recognition ────────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-10">
              The Problem
            </p>
            <RecognitionStack />
          </div>
        </section>

        {/* ── Section 3: The Turn ──────────────────────────────────── */}
        <TheTurnSection calcUrl={calcUrl} />

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
                  <StageCard stage={stage} small />
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
                    <StageCard stage={stage} />
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
              {PROTECTION_CARDS.map(({ Icon, heading, body }) => (
                <div key={heading} className="rounded-md border bg-card p-6">
                  <Icon className="h-5 w-5 text-brand-green mb-4" />
                  <h3 className="font-semibold mb-2">{heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
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
              <Link
                to="/faq"
                className="text-sm font-medium text-brand-green underline underline-offset-4 hover:text-brand-green-light transition-colors"
              >
                All questions
              </Link>
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
              <Link to={calcUrl}>Check your numbers</Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
