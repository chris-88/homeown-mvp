import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const SCENARIOS = [
  {
    q: 'Can I leave before the 60 months are up?',
    a: 'Yes. You can exit at any time with 30 days\' notice. There is no obligation to stay for the full term. Your entry stake is your 1% share of the property. It is equity at risk and is not refunded as cash if you leave early.',
  },
  {
    q: 'What if I lose my job or can\'t make a payment?',
    a: 'A single missed payment does not automatically end the programme. There are defined cure windows (a period of time to catch up) and a clear process before any programme action is taken. The full details are in the Homeown Pathway Agreement, which you receive and review before signing anything.',
  },
  {
    q: 'What if property values fall?',
    a: 'Your purchase price is fixed at 10% below what Homeown paid on the day the property was bought. If values have fallen significantly by month 60, you are not obligated to exercise your option. You can simply exit.',
  },
  {
    q: 'What if property values rise significantly?',
    a: 'Your purchase price is fixed regardless. If the property has increased in value by the end of the term, that increase is reflected in the equity you capture when you buy. This is one of the structural benefits of agreeing the price upfront.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-normal tracking-tight">The Homeown pathway</h1>
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
                <p>The calculator checks whether the property price you have in mind is within reach of a standard mortgage at the end of 60 months. It uses typical Irish bank lending parameters, currently around 3.5x your gross household income. It is not a credit assessment, and it does not check whether you can afford the monthly service fee. That decision is yours.</p>
                <p>The calculator takes two minutes and gives you a clear result: the programme either fits, or it shows you what price range works better for your income.</p>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What you'll find out:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Your monthly service fee at your target property price</li>
                  <li>Your entry stake (1% of the purchase price)</li>
                  <li>Your fixed purchase price (10% below what Homeown paid)</li>
                  <li>Whether the programme fits based on standard mortgage lending rules</li>
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
                <p>If the calculator shows programme fit, the next step is a 20-minute call. This is not a sales call. It is a structured conversation to confirm the programme is right for your situation and that you understand what you are signing up to.</p>
                <p>After the call, we ask for a standard set of documents to verify your income and confirm that the monthly payment is genuinely within your means. We do not run a credit check. We do not assess your creditworthiness. That happens only when you arrange your mortgage at the end of the 60 months.</p>
              </div>
              <Alert className="mt-6">
                <AlertDescription>
                  The entry checks confirm that your income is consistent and the monthly payment is realistic for your situation. Mortgage affordability and creditworthiness are assessed only by an independent bank when you complete your purchase at month 60.
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
                <p>Once accepted onto the programme, a Homeown purchasing agent works with you to find properties that match your brief and pass our checks. Homeown buys the property through a separate ring-fenced company, a Designated Activity Company (DAC), set up specifically for your property.</p>
                <p>You pay your entry stake (1% of the purchase price) at the sale agreed stage. This is your 1% ownership share in the property from that moment. On completion, you receive your pathway agreement, the legally binding document that governs your right to purchase, and you move in.</p>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What the entry stake is:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Your 1% ownership share: you hold a real stake in the property from day one</li>
                  <li>Equity at risk: if you exit the programme early, the stake is not refunded as cash; it is treated as equity you contributed to the property</li>
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
                <p>Each month you pay the service fee, calculated as your property's purchase price × 8.2% ÷ 12. This is not rent and it is not a credit repayment. It is the cost of running the pathway, the same amount every month for the full 60 months.</p>
                <p>Your purchase price was fixed on the day Homeown bought the property, at 10% below what Homeown paid. It does not change over the term, regardless of what happens to property values in either direction.</p>
                <p>Around six months before the end of the term, Homeown contacts you to confirm your intent and start exit preparation. In the final 30 days, the option window opens: you can exercise your right to purchase and arrange your mortgage, or you can exit the programme.</p>
              </div>
              <div className="mt-4 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Where the monthly fee goes</p>
                <p className="mt-1">Part of the monthly fee covers obligations to the investors who funded the property purchase. The remainder is Homeown's income for managing the programme. You are not a lender or investor. This is background context on how the service works, not something you need to manage.</p>
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
                <div className="rounded border p-4">
                  <p className="font-semibold text-sm">Buy your home</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">You arrange a mortgage with any independent bank for the fixed purchase price (10% below what Homeown originally paid). On completion, Homeown transfers full legal title to you. You own your home.</p>
                </div>
                <div className="rounded border p-4">
                  <p className="font-semibold text-sm">Walk away</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">You give 30 days' notice and exit the programme. There is no debt owed to Homeown. Your entry stake is equity at risk and is not returned as cash. You leave with no obligations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What if things change */}
        <div className="mt-20 border-t pt-16">
          <div className="w-8 h-0.5 bg-primary mb-4" />
          <h2 className="text-2xl font-normal tracking-tight">What if your circumstances change?</h2>
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
        <div className="mt-20 rounded bg-brand-green px-8 py-10 text-center text-brand-cream">
          <h2 className="text-xl font-normal">Ready to check your numbers?</h2>
          <p className="mt-2 text-brand-cream/70 text-sm">Two minutes. No account needed.</p>
          <Button asChild size="lg" className="mt-6 bg-brand-cream text-brand-green hover:bg-brand-cream/90">
            <Link to="/calc">Check your numbers</Link>
          </Button>
        </div>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
