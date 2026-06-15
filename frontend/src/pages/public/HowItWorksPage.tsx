import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-normal tracking-tight">The Homeown pathway</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
          A 60-month structured route to homeownership. The full picture of what it involves, how it is structured, and what you are agreeing to.
        </p>

        <div className="mt-16 space-y-16">

          {/* Stage 1 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
              1
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Check your programme fit</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The calculator checks whether the property price you are targeting is within the range that a regulated mortgage could support at the end of the 60-month term. It uses the standard Irish Central Bank loan-to-income lending parameter of 4 times gross household income.
                </p>
                <p>
                  This is not a credit assessment. It does not determine whether you can afford the monthly service fee. That decision is yours, just as the decision to pay a monthly service fee is yours. The calculator takes two minutes and gives you a clear result.
                </p>
              </div>
              <div className="mt-4">
                <p className="font-medium text-sm text-foreground mb-2">What the calculator tells you:</p>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Your monthly service fee at your target property price</li>
                  <li>Your Entry Stake (1% of the purchase price)</li>
                  <li>Your fixed purchase option price (10% below Homeown's acquisition price)</li>
                  <li>Whether the programme fits based on standard Irish mortgage lending parameters</li>
                </ul>
              </div>
              <Button asChild className="mt-6">
                <Link to="/calc">Start the calculator</Link>
              </Button>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
              2
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">A conversation about fit</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  If the calculator shows programme fit, the next step is a 20-minute discovery call. This is not a sales call. It is a structured conversation to ensure the programme is right for your situation and that you understand what you are agreeing to before proceeding.
                </p>
                <p>
                  Following the call, if both parties wish to proceed, you submit a standard set of documents to verify your income and confirm that the monthly service fee is operationally feasible. Standard documents include payslips, six months of bank statements, and proof of identity and address.
                </p>
              </div>
              <Alert className="mt-6">
                <AlertDescription className="leading-relaxed">
                  These checks are to confirm you meet the programme participation criteria and that payments are operationally feasible. Homeown does not assess mortgage affordability or creditworthiness at entry. Mortgage assessment is completed only by an independent regulated lender at exit.
                </AlertDescription>
              </Alert>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                If your income evidence is consistent and payment operability is confirmed, you will be accepted onto the programme as a participant and placed in an eligible cohort awaiting DAC assignment.
              </p>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
              3
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">The property search</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Finding the right property in Ireland's market takes time. The country's supply-constrained environment, particularly in urban areas, means that most participants search for several months between acceptance onto the programme and identifying a suitable property. This is a real property purchase. We do not hold a stock of properties waiting to be assigned.
                </p>
                <p>
                  Once accepted, a Homeown purchasing agent is assigned to your case. They work with you to understand your brief, identify candidate properties across your target area, and attend viewings where needed. When you identify a property you want to progress, the purchasing agent coordinates the go/no-go assessment: structural, legal, and valuation checks.
                </p>
                <p>
                  If the property passes, Homeown proceeds to acquire it through a ring-fenced Designated Activity Company established specifically for your cohort. You pay your Entry Stake at the sale agreed stage. This is 1% of the purchase price. It establishes your 1% beneficial interest in the property.
                </p>
              </div>
              <div className="mt-4">
                <p className="font-medium text-sm text-foreground mb-2">What the Entry Stake is and is not:</p>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>It establishes your 1% beneficial interest in the property from the moment it is paid</li>
                  <li>It is equity at risk. If you exit the programme before completion, it is not refunded as cash</li>
                  <li>It is not a deposit in the mortgage sense. It does not reduce the option price.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
              4
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Living on the pathway</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  On completion of the property acquisition, you move in. Your pathway agreement is signed before this point and governs the full 60-month term.
                </p>
                <p>
                  Each month you pay the monthly service fee (Domiter), calculated as the property's purchase price multiplied by 8.2% divided by 12. This is not rent and it is not a credit repayment. It is the service fee for operating the pathway.
                </p>
                <p>
                  Your purchase option price is fixed on the day Homeown acquires the property, set at 10% below what Homeown paid. It does not change over the 60-month term regardless of what happens to property values in the market.
                </p>
                <p>
                  Approximately six months before the end of the term, Homeown will contact you to confirm your intent and begin exit preparation. In the final 30 days, the option window opens.
                </p>
              </div>
              <div className="mt-4 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">A note on the monthly service fee</p>
                <p>
                  The monthly service fee covers two things: Homeown's obligations to the capital providers who funded the property acquisition, and Homeown's service income. You are not a lender or a bondholder. This is contextual information about how the structure operates, provided for transparency.
                </p>
              </div>
              <div className="mt-4 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Your 6-monthly check-in</p>
                <p>
                  Every six months, your Homeown client contact will schedule a brief call. This is not a review of whether you can stay. It is a relationship check-in to ensure the programme is running smoothly and to flag any changes in your circumstances that may affect your exit planning.
                </p>
              </div>
            </div>
          </div>

          {/* Stage 5 */}
          <div className="flex gap-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
              5
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">The end of the term</h2>
              <p className="mt-4 text-muted-foreground">At the end of 60 months, you have two choices.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded border bg-card p-4">
                  <p className="font-semibold text-sm mb-2">Option A: Exercise your purchase option</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You arrange a regulated mortgage with an independent lender for the fixed option price. On mortgage completion, the DAC transfers full legal title to you. You own your home at the price that was agreed on day one.
                  </p>
                </div>
                <div className="rounded border bg-card p-4">
                  <p className="font-semibold text-sm mb-2">Option B: Exit</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You give 30 days notice that you are not exercising your option. The programme ends. There is no debt owed to Homeown. Your Entry Stake is equity at risk and is not returned as cash. You leave the property.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What if things change */}
        <div className="mt-20 border-t pt-16">
          <h2 className="text-2xl font-normal tracking-tight mb-10">What if your circumstances change?</h2>

          <div className="space-y-8">
            <div className="border-l-2 border-border pl-5">
              <p className="font-semibold">Can I leave before 60 months?</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Yes. You can exit the programme at any time with 30 days notice. There is no obligation to remain for the full term. Your Entry Stake is equity at risk and is not refunded as cash on early exit.
              </p>
            </div>

            <div className="border-l-2 border-border pl-5">
              <p className="font-semibold">What if I miss a payment?</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                The programme has a defined payment governance structure with cure windows. A single missed payment does not automatically end the programme. There is a defined process for addressing payment difficulties. Persistent non-payment will ultimately result in programme cancellation. The full detail is in the Homeown Pathway Agreement, which you receive and review in full before signing.
              </p>
            </div>

            <div className="border-l-2 border-border pl-5">
              <p className="font-semibold">What if property values fall?</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your option price is fixed at 10% below what Homeown paid on the day of acquisition. If property values have fallen significantly by month 60, you are not obligated to exercise your option. You can exit.
              </p>
            </div>

            <div className="border-l-2 border-border pl-5">
              <p className="font-semibold">What if property values rise significantly?</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your option price is fixed. The benefit of any market appreciation above your option price is reflected in the equity you capture at purchase. This is a structural feature of the pathway.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 rounded bg-primary px-8 py-10 text-center text-primary-foreground">
          <h2 className="text-xl font-normal">Ready to check whether it fits your situation?</h2>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Link to="/calc">Check your numbers</Link>
          </Button>
        </div>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
