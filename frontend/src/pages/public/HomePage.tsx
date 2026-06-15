import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { NumbersPreview } from '@/components/shared/NumbersPreview'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

// The one wow interaction: fires 600ms after mount, counts 0 → 11 with ease-out
function useCountUp(target: number, delay = 600, duration = 1800) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const started = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - started) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setCount(Math.round(eased * target))
        if (p < 1) requestAnimationFrame(tick)
        else setDone(true)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, delay, duration])

  return { count, done }
}

const FAQS = [
  {
    q: 'Is this the same as renting?',
    a: 'No. There is no tenancy agreement. From day one you hold a beneficial ownership stake in the property and have a legally binding right to buy the rest at the agreed price. The monthly service fee is not a form of rent.',
  },
  {
    q: 'What if I cannot get a mortgage at the end of the term?',
    a: 'You are not obligated to buy. If you choose not to, or if approval is not available at that point, you exit with 30 days notice. There is no debt owed to Homeown.',
  },
  {
    q: 'Who actually owns the property?',
    a: 'Legal title is held by a Designated Activity Company — a separate ring-fenced legal entity set up specifically for your property. Homeown manages the programme but does not own the property.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left font-medium hover:text-foreground/80 transition-colors"
      >
        <span>{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <p className="pb-5 text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function HomePage() {
  const { count, done } = useCountUp(11)

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        {/* ── 1. HERO: Recognition ──────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-32 md:pb-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-green/60 mb-8">
            Irish Property Ownership Pathway
          </p>

          <h1 className="text-5xl font-normal tracking-tight sm:text-6xl lg:text-[4.5rem] max-w-3xl leading-[1.06]">
            You can afford<br className="hidden sm:block" /> the home.
            <br />
            The deposit is<br className="hidden sm:block" /> what's stopping you.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
            Move in now. Buy it in five years at a price agreed today.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Button asChild size="lg" className="text-base px-6">
              <Link to="/calc">Check your numbers →</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-base px-6 text-muted-foreground">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">2 minutes. No account needed.</p>

          {/* THE WOW: deposit years vs this year */}
          <div className="mt-16 grid grid-cols-2 gap-3 max-w-xl">
            <div className="rounded-2xl border bg-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
                Saving a 10% deposit
              </p>
              <div className="flex items-end gap-2 leading-none">
                <span
                  className="text-7xl font-normal text-foreground/70 tabular-nums"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {count}
                </span>
                <span
                  className={`text-2xl text-muted-foreground mb-1 transition-opacity duration-700 ${done ? 'opacity-100' : 'opacity-0'}`}
                >
                  yrs
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-snug">
                Avg. Irish household, avg. Dublin home price
              </p>
            </div>

            <div className="rounded-2xl bg-brand-green p-6 md:p-8 flex flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/50 mb-5">
                With Homeown
              </p>
              <div>
                <p
                  className="text-4xl md:text-5xl font-normal text-brand-cream leading-[1.1]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  This<br />year.
                </p>
                <p className="mt-4 text-xs text-brand-cream/50 leading-snug">
                  Price fixed before<br />you move in
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. RELIEF: Built for people like me ──────────────────── */}
        <section className="border-t py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-green/60 mb-5">
              Who this is for
            </p>
            <h2 className="text-3xl md:text-4xl font-normal max-w-2xl leading-snug">
              Designed for people who can afford to own —<br className="hidden md:block" /> just not all at once.
            </h2>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {[
                {
                  role: 'Teacher, Wicklow',
                  copy: 'Can afford €1,800 a month. Could never pull together €36,000 upfront.',
                },
                {
                  role: 'Nurse, Dublin 8',
                  copy: 'Three years searching. Every time she got close, the price moved.',
                },
                {
                  role: 'Couple, Cork',
                  copy: "Monthly repayments are fine. It's the first lump sum that keeps them out.",
                },
              ].map(({ role, copy }) => (
                <div key={role} className="rounded-2xl border bg-card p-6">
                  <p className="text-sm font-semibold text-brand-green">{role}</p>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. POSSIBILITY: Live numbers ─────────────────────────── */}
        <section className="border-t bg-brand-green-muted/40 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-green/60 mb-5">
              Your numbers
            </p>
            <h2 className="text-3xl md:text-4xl font-normal mb-10">
              What would it actually cost?
            </h2>
            <NumbersPreview />
          </div>
        </section>

        {/* ── 4. CLARITY: How it works ─────────────────────────────── */}
        <section className="border-t py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-green/60 mb-5">
              The pathway
            </p>
            <h2 className="text-3xl md:text-4xl font-normal mb-14">
              Three steps. Five years. Your home.
            </h2>

            <div className="grid gap-10 md:gap-6 md:grid-cols-3">
              {[
                {
                  n: '01',
                  title: 'Check your fit',
                  body: 'Two minutes in the calculator gives you three numbers: the monthly fee, the upfront entry stake, and the fixed purchase price.',
                },
                {
                  n: '02',
                  title: 'Move in',
                  body: 'We find the property together. We buy it through a ring-fenced legal entity, you pay your entry stake, and you move in — holding a 1% ownership stake from day one.',
                },
                {
                  n: '03',
                  title: 'Buy it',
                  body: 'At month 60, arrange a standard mortgage with any bank and complete the purchase at the price agreed before you moved in. Or walk away — no obligation, no debt.',
                },
              ].map(({ n, title, body }) => (
                <div key={n}>
                  <span
                    className="block text-6xl font-normal text-border leading-none mb-4 select-none"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {n}
                  </span>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button asChild variant="outline">
                <Link to="/how-it-works">Full pathway details</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── 5. TRUST: Structure and protection ───────────────────── */}
        <section className="border-t bg-brand-green-muted/40 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-green/60 mb-5">
              Protection
            </p>
            <h2 className="text-3xl md:text-4xl font-normal mb-12 max-w-xl">
              The structure is designed to protect you.
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  title: 'Your price is fixed in writing before you move in',
                  body: 'The purchase option price is agreed and written into your contract at the start. It does not change over the 60-month term, regardless of what the market does.',
                },
                {
                  title: 'The property is legally ring-fenced',
                  body: 'Title is held by a Designated Activity Company set up specifically for your property. Homeown manages the programme but does not own the property.',
                },
                {
                  title: 'You hold an ownership stake from day one',
                  body: 'From the moment you move in, you hold a beneficial ownership interest. This is not a tenancy. There is no landlord relationship between you and Homeown.',
                },
                {
                  title: 'No debt if you exit',
                  body: 'The purchase option is a right, not an obligation. If you choose to leave, you give 30 days notice. Nothing is owed to Homeown.',
                },
              ].map(({ title, body }) => (
                <div key={title} className="rounded-2xl border bg-card p-6">
                  <div className="w-5 h-0.5 bg-brand-green mb-4" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. FAQ: Common questions ─────────────────────────────── */}
        <section className="border-t py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-green/60 mb-5">
              Questions
            </p>
            <h2 className="text-3xl md:text-4xl font-normal mb-10">
              The questions people ask first.
            </h2>

            <div className="divide-y border-y">
              {FAQS.map(item => (
                <FaqItem key={item.q} {...item} />
              ))}
            </div>

            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to="/faq">All questions</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── ACTION: Final CTA ─────────────────────────────────────── */}
        <section className="bg-brand-green py-24 md:py-32">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2
              className="text-4xl md:text-5xl font-normal text-brand-cream leading-tight"
            >
              Ready to see if the<br />pathway fits you?
            </h2>
            <p className="mt-5 text-brand-cream/50 text-lg">
              Two minutes. No account. No commitment.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-10 bg-brand-cream text-brand-green hover:bg-brand-cream/90 text-base h-auto px-8 py-4"
            >
              <Link to="/calc">Check your numbers →</Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
