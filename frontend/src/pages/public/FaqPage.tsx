import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

const GROUPS = [
  {
    heading: 'Understanding the programme',
    faqs: [
      {
        q: 'Is the monthly service fee rent?',
        a: 'No. The monthly service fee (Domiter) is not rent, and there is no tenancy agreement between you and Homeown. From the moment you complete your Entry Stake, you hold a 1% beneficial interest in the property and a contractual right to purchase it. The monthly payment is the service fee for operating that pathway. It is not a payment for occupation of the property.',
      },
      {
        q: 'How is the monthly service fee calculated?',
        a: 'The service fee is calculated as: property purchase price × 8.2% ÷ 12. For a €400,000 property, that is €2,733 per month. The rate is fixed for the term of the programme.',
      },
      {
        q: 'Is the purchase option price guaranteed?',
        a: 'The option price is contractually fixed at the moment Homeown acquires the property, set at 10% below what Homeown paid. It does not change over the 60-month term. It is not subject to market adjustments, valuation changes, or renegotiation.',
      },
      {
        q: 'What is the Entry Stake?',
        a: 'The Entry Stake is 1% of the property purchase price, paid once at the sale agreed stage. It establishes your 1% beneficial interest in the property. It is equity at risk: if you exit the programme, it is not refunded as cash. It is not a deposit in the traditional sense; it is your stake in the property from day one.',
      },
      {
        q: 'Is this rent-to-buy?',
        a: 'No. Rent-to-buy schemes typically involve a rental agreement with an option to purchase later. Homeown is different in structure and in substance: there is no tenancy agreement, no landlord-tenant relationship, and no rental income flowing to Homeown. You hold a beneficial interest in the property from day one. The monthly service fee is not rent.',
      },
    ],
  },
  {
    heading: 'The structure',
    faqs: [
      {
        q: 'Who owns the property?',
        a: 'Legal title to the property is held by a Designated Activity Company (DAC), a separate legal entity established specifically for each property cohort. Homeown Limited does not own the property. The DAC is funded by third-party capital providers and is operationally passive. Homeown manages it as servicer.',
      },
      {
        q: 'What is Homeown\'s role?',
        a: 'Homeown Limited is the servicer. It collects monthly service fees, manages programme governance, coordinates property acquisition, and facilitates the exit or completion process. It is not a lender, not a landlord, and not a mortgage provider.',
      },
      {
        q: 'Is Homeown regulated?',
        a: 'Homeown is structured to operate outside the regulatory perimeter for retail credit and residential tenancies, because the programme is not a credit product and does not involve a tenancy. Homeown\'s structure and documentation have been designed with this regulatory posture in mind. Legal counsel has reviewed the structure. This is not the same as being unregulated. It means the programme is designed to be demonstrably different from regulated products.',
      },
      {
        q: 'What capital providers fund the property acquisition?',
        a: 'Each property cohort is funded by a combination of senior capital (from institutional lenders) and subordinated capital (from a private group of invited investors). These investors are separate from Homeown Limited. Their capital is held at the DAC level, not by Homeown.',
      },
    ],
  },
  {
    heading: 'Eligibility and process',
    faqs: [
      {
        q: 'Who is the programme for?',
        a: 'The programme is designed for first-time buyers who can sustain mortgage-level monthly service fee payments but have not yet accumulated sufficient capital for a standard mortgage entry. It is not for everyone. The programme fit calculator will tell you whether your situation aligns.',
      },
      {
        q: 'How does the programme fit check work?',
        a: 'The calculator checks one thing: whether the property price you are targeting is within range for a regulated mortgage at the end of the 60-month term, based on standard Irish lending parameters. It is not a credit assessment. It does not check whether you can afford the monthly service fee. That is your decision. The full check is completed in two minutes.',
      },
      {
        q: 'Will my credit rating be checked?',
        a: 'Homeown does not run a credit check at entry. The programme participation assessment checks income verification and payment operability only, not creditworthiness. A credit assessment will be conducted by the independent regulated lender of your choice when you arrange your mortgage at the end of the term.',
      },
      {
        q: 'What documents are required?',
        a: 'Standard income evidence: payslips, bank statements (6 months), and proof of identity and address. For self-employed applicants: accounts, tax documentation, and an accountant letter. Documents are used to verify income consistency and confirm payment operability, not to assess creditworthiness.',
      },
      {
        q: 'What areas does Homeown operate in?',
        a: 'Homeown currently operates across the Republic of Ireland, with property acquisition spanning all counties. Dublin properties are tracked at postcode level given the size of the market.',
      },
    ],
  },
  {
    heading: 'Risks and exit',
    faqs: [
      {
        q: 'What are the risks?',
        a: 'The Entry Stake is equity at risk. If you exit the programme before the end of the term, it is not refunded as cash. The 60-month term is fixed; there is no early completion. Mortgage approval at the end of the term is not guaranteed by Homeown; it depends on an independent lender\'s assessment at that time. If you cannot arrange a mortgage at exit, you can choose not to exercise your option, but your Entry Stake remains at risk.',
      },
      {
        q: 'What happens if I miss a payment?',
        a: 'The programme has a defined payment governance structure with cure windows. A single missed payment does not automatically end the programme. Persistent non-payment will result in a breach and ultimately programme cancellation. The full details of the payment governance structure are set out in the Homeown Pathway Agreement.',
      },
      {
        q: 'Can I leave early?',
        a: 'Yes. You can exit the programme at any time with 30 days\' notice. There is no ongoing debt to Homeown on exit. Your Entry Stake is equity at risk and is not refunded as cash.',
      },
      {
        q: 'What happens at the end of the term if I don\'t want to buy?',
        a: 'You give notice that you are not exercising your option. The programme ends. There is no debt owed to Homeown. Your Entry Stake is equity at risk.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
        <p className="mt-4 text-muted-foreground">Plain-English answers to common questions about the Homeown pathway.</p>

        <div className="mt-12 space-y-10">
          {GROUPS.map(group => (
            <div key={group.heading}>
              <h2 className="mb-2 text-lg font-semibold">{group.heading}</h2>
              <Accordion type="single" collapsible className="divide-y rounded-xl border px-4">
                {group.faqs.map(faq => (
                  <AccordionItem key={faq.q} value={faq.q} className="border-none">
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-16 rounded-xl border bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-semibold">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The best way to get answers specific to your situation is a 20-minute discovery call. Start by checking your numbers.
          </p>
          <Button asChild className="mt-6">
            <Link to="/calc">Check your numbers</Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Or email us at{' '}
            <a href="mailto:hello@homeown.ie" className="underline underline-offset-2 hover:text-foreground">
              hello@homeown.ie
            </a>
          </p>
        </div>
      </main>

      <PublicFooter />
      <CookieBanner />
    </div>
  )
}
