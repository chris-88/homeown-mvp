import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const SCENARIOS = [
  {
    q: 'Can I leave before the 60 months are up?',
    a: 'Yes. You can exit at any time with 30 days\' notice. There is no obligation to stay for the full term. Your Entry Stake is equity at risk — it is not refunded as cash on exit.',
  },
  {
    q: 'What if I lose my job or can\'t make a payment?',
    a: 'The programme has a defined payment governance structure. A single missed payment does not automatically end the programme. There are cure windows and a defined process. The full details are in the Homeown Pathway Agreement, which you receive and review before signing.',
  },
  {
    q: 'What if property values fall?',
    a: 'Your purchase option price is fixed at 10% below what Homeown paid on the day of acquisition. If property values have fallen significantly by month 60, you are not obligated to exercise your option. You can simply exit.',
  },
  {
    q: 'What if property values rise significantly?',
    a: 'Your option price is fixed. If the property has increased in value, the benefit of that growth is reflected in the equity you capture at purchase. This is one of the structural features of the pathway.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">The Homeown pathway</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          A 60-month structured route to homeownership. Move in now, complete the purchase at the end of the term.
        </p>

        <div className="mt-16 space-y-16">

          {/* Stage 1 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">1</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Check your programme fit</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>The calculator checks whether the property you have in mind is within range for a regulated mortgage at the end of the 60-month term — using standard Irish lending parameters. It is not a credit assessment and it does not check whether you can afford the monthly service fee. That decision is yours.</p>
                <p>The calculator takes two minutes and gives you a clear result: the programme either fits your situation, or it tells you what price range works better for your income.</p>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What you'll find out:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Your monthly service fee at your target property price</li>
                  <li>Your Entry Stake (1% of the purchase price)</li>
                  <li>Your fixed purchase option price (10% below acquisition price)</li>
                  <li>Whether the programme fits based on standard mortgage lending parameters</li>
                </ul>
              </div>
              <Button asChild className="mt-6">
                <Link to="/calc">Start the calculator</Link>
              </Button>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">2</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">A conversation about fit</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>If the calculator shows programme fit, the next step is a 20-minute discovery call. This is not a sales call. It is a structured conversation to confirm the programme is right for your situation and that you understand what you are signing up to.</p>
                <p>After the call, we ask for a standard set of documents to verify your income and confirm operational feasibility of the monthly service fee. We do not assess creditworthiness. We do not provide an approval in principle. We confirm programme participation criteria only.</p>
              </div>
              <Alert className="mt-6">
                <AlertDescription>
                  These checks are to confirm you meet the programme participation criteria and that payments are operationally feasible. Homeown does not assess mortgage affordability or creditworthiness at entry. Mortgage assessment is completed only by an independent regulated lender at exit.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">3</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Finding your property and moving in</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>Once accepted onto the programme, a Homeown purchasing agent works with you to identify properties that meet your brief and pass our go/no-go checks. Homeown acquires the property through a ring-fenced Designated Activity Company established specifically for your cohort.</p>
                <p>You pay your Entry Stake (1% of the purchase price) at the sale agreed stage. This establishes your 1% beneficial interest in the property. On completion, you receive your pathway agreement — the legally binding document that governs your option to purchase — and you move in.</p>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What the Entry Stake is:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Your 1% beneficial interest — you hold a stake in the property from day one</li>
                  <li>Equity at risk — if you exit the programme, the Entry Stake is not refunded as cash; it is treated as equity contributed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">4</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Living on the pathway</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>Each month you pay the service fee (Domiter), calculated as your property's purchase price × 8.2% ÷ 12. This is not rent and it is not a credit repayment. It is the service fee for operating the pathway.</p>
                <p>Your purchase option price was fixed on the day Homeown acquired the property — 10% below what Homeown paid. It does not change over the 60-month term regardless of what happens to property values.</p>
                <p>Approximately six months before the end of the term, Homeown will contact you to confirm your intent and begin exit preparation. In the final 30 days, the option window opens. You can exercise your option to purchase — arranging a regulated mortgage through an independent lender — or you can exit.</p>
              </div>
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">The Domiter split</p>
                <p className="mt-1">Part of your monthly service fee covers Homeown's obligations to the capital providers who funded the property acquisition. The remainder is Homeown's service income. You are not a lender, a creditor, or a bondholder — this is purely contextual information about how the service operates.</p>
              </div>
            </div>
          </div>

          {/* Stage 5 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">5</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">The end of the term</h2>
              <p className="mt-4 text-muted-foreground">At the end of 60 months, you have two choices.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="font-semibold text-sm">Exercise your option</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">You arrange a regulated mortgage with an independent lender for the fixed option price (10% below Homeown's original acquisition price). On completion, Homeown transfers full legal title to you. You own your home.</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-semibold text-sm">Exit</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">You give 30 days' notice. The programme ends. There is no debt owed to Homeown. Your Entry Stake is equity at risk and is not returned as cash. You leave with your life and circumstances intact — just not as an owner of this property.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What if things change */}
        <div className="mt-20 border-t pt-16">
          <h2 className="text-2xl font-bold">What if your circumstances change?</h2>
          <div className="mt-8 space-y-6">
            {SCENARIOS.map(s => (
              <div key={s.q} className="border-l-2 border-border pl-4">
                <p className="font-medium">{s.q}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 rounded-xl bg-foreground px-8 py-10 text-center text-background">
          <h2 className="text-xl font-bold">Ready to check your numbers?</h2>
          <p className="mt-2 text-background/70 text-sm">Two minutes. No account needed.</p>
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/calc">Check your numbers</Link>
          </Button>
        </div>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
