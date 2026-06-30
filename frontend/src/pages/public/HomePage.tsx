import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Shield, Home, CheckCircle2, Info } from 'lucide-react'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { TheTurnSection } from '@/components/shared/TheTurnSection'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { AnimatedEmblem } from '@/components/shared/AnimatedEmblem'
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

// Staggered scroll-reveal: hides children, reveals them in sequence when container enters view.
// Direct DOM manipulation keeps React out of the animation path.
function useStaggerReveal(staggerMs = 80) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const children = Array.from(el.children) as HTMLElement[]
    children.forEach(child => {
      child.style.opacity = '0'
      child.style.transform = 'translateY(16px)'
    })

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        children.forEach((child, i) => {
          const delay = `${i * staggerMs}ms`
          child.style.transition = `opacity var(--dur-standard) var(--ease-out) ${delay}, transform var(--dur-standard) var(--ease-out) ${delay}`
          child.style.opacity = '1'
          child.style.transform = 'translateY(0)'
        })
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [staggerMs])

  return containerRef
}

// Shared style tokens
const EYEBROW = 'text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-taupe mb-3'
const SECTION_HEAD = 'text-3xl font-normal tracking-tight md:text-[2.5rem]'
const CTA_BTN = 'inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-colors'


const RECOGNITION = [
  'I can afford the monthly cost. I cannot save the upfront amount.',
  'Every time I get close, the price moves again.',
  'My bank will approve the mortgage. The deposit is the part I can never get ahead of.',
  'I have been searching for years. I am further away now than when I started.',
]

function RecognitionCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent(i => (i + 1) % RECOGNITION.length), 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      {/* All statements stacked in the same grid cell; only one is visible */}
      <div className="grid">
        {RECOGNITION.map((text, i) => (
          <p
            key={i}
            style={{ gridColumn: '1', gridRow: '1' }}
            className={cn(
              'text-xl font-medium leading-snug md:text-2xl text-brand-ink',
              'transition-opacity duration-700 ease-in-out',
              i === current ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}
          >
            {text}
          </p>
        ))}
      </div>
      {/* Progress dots */}
      <div className="flex gap-2 mt-10">
        {RECOGNITION.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Statement ${i + 1}`}
            className={cn(
              'h-[3px] rounded-full bg-brand-ink transition-all duration-500 cursor-pointer',
              i === current ? 'w-8 opacity-100' : 'w-3 opacity-20'
            )}
          />
        ))}
      </div>
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
    body: 'Set at acquisition and written into your agreement before you move in. 10% below what Homeown paid. Fixed for the full 60-month term.',
  },
  {
    Icon: Shield,
    heading: 'The property is legally ring-fenced',
    body: 'Legal title is held by a ring-fenced DAC set up for your cohort only. Homeown does not hold legal title and cannot deal with the property outside the programme.',
  },
  {
    Icon: Home,
    heading: 'You hold a beneficial interest from day one',
    body: 'From the moment you complete your Entry Stake, you hold a 1% beneficial interest in the property. Not a tenancy. Governed by a legally binding agreement.',
  },
  {
    Icon: CheckCircle2,
    heading: 'No debt between you and Homeown',
    body: 'Nothing owed to Homeown at any point. No amortisation, no interest. If you exit, you leave with no obligation.',
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
          <DialogDescription className="leading-relaxed pt-2">{text}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const heroViewFired = useRef(false)
  const stagesRef = useStaggerReveal(70)
  const cardsRef = useStaggerReveal(80)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const knownHooks = ['rent-trap', 'twin-cost', 'fairness', 'futility']
    const hookParam = params.get('hook') ?? ''
    const resolvedHook = knownHooks.includes(hookParam) ? hookParam : 'default'
    sessionStorage.setItem('homeown_hook', resolvedHook)

    const utm: Record<string, string> = {}
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const val = params.get(key)
      if (val) utm[key] = val
    })
    if (Object.keys(utm).length) sessionStorage.setItem('homeown_utm', JSON.stringify(utm))
    if (!sessionStorage.getItem('homeown_session_id'))
      sessionStorage.setItem('homeown_session_id', crypto.randomUUID())
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

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        {/* ── 1. Belief ─────────────────────────────────────────────── */}
        <section ref={heroRef} className="-mt-16 min-h-screen flex flex-col justify-center border-b">
          <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
            <div className="flex justify-center mb-12 animate-hero-enter" style={{ animationDelay: '80ms' }}>
              <AnimatedEmblem className="h-28 w-auto" />
            </div>
            <p
              className="text-base text-brand-taupe leading-relaxed animate-hero-enter"
              style={{ animationDelay: '160ms' }}
            >
              You're not failing. The target moved.
            </p>
            <h1
              className="mt-3 text-5xl font-normal tracking-tight leading-[1.06] animate-hero-enter"
              style={{ animationDelay: '240ms' }}
            >
              Stop chasing the deposit.
            </h1>
            <p
              className="mt-6 text-base text-brand-taupe leading-relaxed max-w-lg mx-auto animate-hero-enter"
              style={{ animationDelay: '320ms' }}
            >
              Move in now. Pay one monthly pathway fee. Buy later through a standard mortgage at a price fixed from day one.
            </p>
            <div className="mt-10 animate-hero-enter" style={{ animationDelay: '400ms' }}>
              <Link
                to={calcUrl}
                onClick={() => track('hero_cta_click', {})}
                className={CTA_BTN + ' active:scale-[0.97] transition-transform'}
              >
                Check your numbers
              </Link>
              <p className="mt-3 text-xs text-brand-taupe">Two minutes. No account required.</p>
            </div>
          </div>
          <div id="nav-sentinel" />
        </section>

        {/* ── 2. Problem, felt ──────────────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-6">
            <p className={EYEBROW}>The problem</p>
            <RecognitionCarousel />
          </div>
        </section>

        {/* ── 3. The turn ───────────────────────────────────────────── */}
        <TheTurnSection calcUrl={calcUrl} />

        {/* ── 4. What actually happens ──────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <p className={EYEBROW}>The pathway</p>
            <h2 className={cn(SECTION_HEAD, 'mb-12')}>What actually happens</h2>
            <div ref={stagesRef} className="space-y-10">
              {STAGES.map(stage => (
                <div key={stage.n} className="flex gap-6">
                  <span className="flex-none flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-xs font-bold text-primary">
                    {stage.n}
                  </span>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold mb-1.5">{stage.heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{stage.body}</p>
                    {stage.info && <StageInfoDialog text={stage.info} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 pl-14">
              <Link
                to="/how-it-works"
                className="text-sm font-medium text-brand-green underline underline-offset-4 hover:text-brand-green-light transition-colors"
              >
                Full pathway detail and all stages
              </Link>
            </div>
          </div>
        </section>

        {/* ── 5. Why it's safe ──────────────────────────────────────── */}
        <section className="border-b py-20 md:py-28 bg-muted/20">
          <div className="mx-auto max-w-3xl px-6">
            <p className={EYEBROW}>How you're protected</p>
            <h2 className={cn(SECTION_HEAD, 'mb-12')}>The structure is designed to protect you.</h2>
            <div ref={cardsRef} className="grid gap-5 sm:grid-cols-2">
              {PROTECTION_CARDS.map(({ Icon, heading, body }) => (
                <div
                  key={heading}
                  className="rounded-lg border bg-card p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Icon className="h-5 w-5 text-brand-green mb-4" />
                  <h3 className="font-semibold mb-2 text-[15px] leading-snug">{heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Residual questions ─────────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <p className={EYEBROW}>Questions</p>
            <h2 className={cn(SECTION_HEAD, 'mb-10')}>The questions people ask first.</h2>
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

        {/* ── 7. The ask ────────────────────────────────────────────── */}
        <section className="bg-primary py-24 md:py-32">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-4xl font-normal tracking-tight text-primary-foreground md:text-5xl leading-tight">
              Ready to see if the programme fits?
            </h2>
            <p className="mt-5 text-primary-foreground/70">
              Two minutes. No account. No commitment.
            </p>
            <div className="mt-10">
              <Link
                to={calcUrl}
                className="inline-flex items-center justify-center rounded-lg bg-primary-foreground px-8 py-3.5 text-[15px] font-medium text-primary hover:bg-primary-foreground/90 transition-[background-color,transform] active:scale-[0.97]"
              >
                Check your numbers
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
