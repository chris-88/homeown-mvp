import { PublicNav } from '@/components/shared/PublicNav'
import { Separator } from '@/components/ui/separator'

const stages = [
  {
    number: '01',
    title: 'Programme participation assessment',
    body: `We review your income, employment, and household circumstances to assess whether you are eligible to participate in the Homeown pathway. This is not a credit assessment. We are assessing suitability for the programme.`,
  },
  {
    number: '02',
    title: 'Eligibility letter and property search',
    body: `Once eligible, you receive a Homeown Eligibility Letter confirming your maximum property price band. You then search the open market freely , estate agents, property portals, and viewings are all in your control.`,
  },
  {
    number: '03',
    title: 'Sale agreed and legal completion',
    body: `When you have found a property and have sale agreed, you submit the details to Homeown. We complete a valuation, issue a formal approval notice, and manage conveyancing. From day one of legal completion you hold 1% beneficial interest.`,
  },
  {
    number: '04',
    title: 'In home , 60-month pathway',
    body: `You live in the property and pay a fixed monthly service fee (Domiter) for 60 months. At month 60 you have the option , but not the obligation , to purchase the remaining 99% at 10% below the original purchase price, subject to independent mortgage assessment.`,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">How Homeown works</h1>
        <p className="mt-4 text-muted-foreground">
          Homeown is a structured property ownership pathway. You hold beneficial interest from day one and have the option to complete ownership at the end of your term.
        </p>

        <div className="mt-12 space-y-10">
          {stages.map((stage, i) => (
            <div key={stage.number}>
              <div className="flex items-start gap-6">
                <span className="text-3xl font-bold text-muted-foreground/40">{stage.number}</span>
                <div>
                  <h2 className="text-xl font-semibold">{stage.title}</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{stage.body}</p>
                </div>
              </div>
              {i < stages.length - 1 && <Separator className="mt-10" />}
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Important:</strong> Homeown does not provide mortgage credit. The purchase option at end of term is a right, not an obligation. Mortgage approval at end of term is subject to an independent regulated lender's assessment and is not guaranteed. Monthly payments are a service fee, not rent and not credit repayments.
        </div>
      </main>
    </div>
  )
}
