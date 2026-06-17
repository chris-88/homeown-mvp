import { LegalLayout, LegalSection } from './LegalLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function KfsPage() {
  return (
    <LegalLayout
      title="Key Facts Sheet"
      lastUpdated="12 June 2026"
      subheading="What the Homeown pathway is, what it isn't, and what you are agreeing to."
    >
      <Alert>
        <AlertDescription>
          This Key Facts Sheet is a summary disclosure document. It does not replace the Homeown Pathway Agreement, which is the legally binding contract governing your participation. Read both documents carefully before signing.
        </AlertDescription>
      </Alert>

      <LegalSection heading="What is Homeown?">
        <p>Homeown is a structured property ownership pathway designed to help you progress toward homeownership. It is not a mortgage, a tenancy, a loan, or a rent-to-buy scheme.</p>
        <p>Under the Homeown pathway:</p>
        <ul className="space-y-1 list-disc list-inside text-sm">
          <li>Homeown (as servicer) coordinates the acquisition of a property through a ring-fenced Designated Activity Company (DAC)</li>
          <li>You pay a monthly service fee (Domiter) for 60 months</li>
          <li>You hold a 1% beneficial interest in the property from day one</li>
          <li>You have a contractual right, but not an obligation, to purchase the property at the end of the term at a fixed option price</li>
        </ul>
      </LegalSection>

      <LegalSection heading="What Homeown is not">
        <ul className="space-y-2 list-disc list-inside text-sm">
          <li><strong className="text-foreground">Not a lender.</strong> Homeown does not provide credit or charge interest. There is no loan agreement between you and Homeown.</li>
          <li><strong className="text-foreground">Not a landlord.</strong> There is no tenancy agreement. The monthly service fee is not rent. You are not a tenant of Homeown.</li>
          <li><strong className="text-foreground">Not a mortgage provider.</strong> Homeown does not arrange, assess, or guarantee mortgage approval. Mortgage approval at the end of the term is subject to assessment by an independent regulated lender.</li>
          <li><strong className="text-foreground">Not a guaranteed purchase.</strong> The purchase option is a contractual right. You are not obligated to exercise it, and exercising it depends on your ability to arrange a regulated mortgage at exit.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="The key figures">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Monthly service fee (Domiter)',
              formula: 'Property price × 8.2% ÷ 12',
              note: 'Fixed for the 60-month term. Not rent. Not a credit repayment.',
            },
            {
              label: 'Entry Stake',
              formula: '1% of property purchase price',
              note: 'Paid once at sale agreed stage. Establishes your 1% beneficial interest. Equity at risk.',
            },
            {
              label: 'Purchase option price',
              formula: '90% of Homeown\'s acquisition price',
              note: 'Fixed on day one. Does not change over the term. Set 10% below acquisition price.',
            },
          ].map(item => (
            <div key={item.label} className="rounded-lg border p-4 text-sm">
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 font-mono text-xs text-primary">{item.formula}</p>
              <p className="mt-2 text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection heading="The term">
        <ul className="space-y-1 list-disc list-inside text-sm">
          <li><strong className="text-foreground">Duration:</strong> 60 months (5 years)</li>
          <li><strong className="text-foreground">Early exit:</strong> You may exit at any time with 30 days' notice</li>
          <li><strong className="text-foreground">Early completion:</strong> Not available; the term is fixed at 60 months</li>
          <li><strong className="text-foreground">Option window:</strong> Opens in the final 30 days of the term</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your beneficial interest">
        <p>From the moment you pay your Entry Stake, you hold a 1% beneficial interest in the property. This is a legal interest in the property; it is not a tenancy right or a credit arrangement.</p>
        <p>The beneficial interest does not increase over the term. At the end of the term, you have the right to purchase the remaining 99% at the fixed option price.</p>
      </LegalSection>

      <LegalSection heading="The purchase option">
        <p>The purchase option is a contractual right to buy the property at the end of the 60-month term at the fixed option price (90% of Homeown's acquisition price). Key facts:</p>
        <ul className="space-y-1 list-disc list-inside text-sm">
          <li>The option price is fixed on the day Homeown acquires the property and does not change</li>
          <li>Exercising the option requires arranging a regulated mortgage with an independent lender; Homeown does not provide this</li>
          <li>You are not obligated to exercise the option</li>
          <li>If you do not exercise the option, there is no debt owed to Homeown</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Risks">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-2">
          <p className="font-semibold text-foreground">You should be aware of the following risks before entering the programme:</p>
          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
            <li><strong className="text-foreground">Entry Stake is equity at risk.</strong> If you exit the programme, for any reason, your Entry Stake is not refunded as cash. It is treated as equity contributed to the property structure.</li>
            <li><strong className="text-foreground">Mortgage approval is not guaranteed.</strong> At the end of the term, you must arrange your own mortgage with an independent regulated lender. Homeown cannot guarantee approval. If approval is not forthcoming, you can exit, but your Entry Stake remains at risk.</li>
            <li><strong className="text-foreground">Non-payment risk.</strong> Persistent non-payment of the monthly service fee will result in programme cancellation. Review the payment governance provisions in the Homeown Pathway Agreement before signing.</li>
            <li><strong className="text-foreground">Property value risk.</strong> Property values may fall. Your option price is fixed regardless of market movements; you are not obligated to exercise the option if the property has declined in value.</li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection heading="The property structure">
        <p>Legal title to the property is held by a ring-fenced Designated Activity Company (DAC), a separate legal entity established specifically for each property cohort. The DAC is funded by a combination of senior capital (institutional) and subordinated capital (private investors).</p>
        <p>Homeown Limited acts as servicer to the DAC. It does not own the property and is not your landlord.</p>
        <p>Your beneficial interest and purchase option are governed by the Homeown Pathway Agreement, which is a legally binding contract between you and the DAC.</p>
      </LegalSection>

      <LegalSection heading="Programme participation assessment">
        <p>Before entering the programme, Homeown carries out a programme participation assessment. This is not a credit assessment. It covers:</p>
        <ul className="space-y-1 list-disc list-inside text-sm">
          <li>Identity verification (KYC/AML compliance)</li>
          <li>Income verification (to confirm payment operability)</li>
          <li>Programme fit (to confirm the property price is within an appropriate range)</li>
        </ul>
        <p className="text-sm font-medium text-foreground">Homeown does not assess creditworthiness, mortgage affordability, or future mortgage eligibility at entry. These assessments are conducted only by an independent regulated lender at the end of the term.</p>
      </LegalSection>

      <LegalSection heading="How to get further information">
        <p>Before signing the Homeown Pathway Agreement, you should:</p>
        <ul className="space-y-1 list-disc list-inside text-sm">
          <li>Read the full Homeown Pathway Agreement</li>
          <li>Seek independent legal advice</li>
          <li>Seek independent financial advice</li>
          <li>Ask any questions you have to the Homeown team at <a href="mailto:hello@homeown.ie" className="underline underline-offset-2 hover:text-foreground">hello@homeown.ie</a></li>
        </ul>
      </LegalSection>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div>
          <p>Version 0.2 | Last reviewed 12 June 2026</p>
          <p className="mt-1">This document has been prepared by Homeown Limited. It is not legal or financial advice. Seek independent advice before entering the programme.</p>
          <p className="mt-1 font-medium text-brand-burgundy dark:text-brand-burgundy-light">COUNSEL REVIEW REQUIRED BEFORE PUBLISHING.</p>
        </div>
        <Button variant="outline" size="sm" asChild className="ml-4 shrink-0">
          <a href="/kfs.pdf" download>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </Button>
      </div>

    </LegalLayout>
  )
}
