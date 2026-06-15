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
        a: 'No. The monthly service fee, called Domiter, is not rent and there is no tenancy agreement between you and Homeown. From the moment you complete your Entry Stake, you hold a 1% beneficial interest in the property and a contractual right to purchase it at the fixed option price. The monthly payment is the service fee for operating the pathway, not a payment for occupation.',
      },
      {
        q: 'How is the monthly service fee calculated?',
        a: 'The fee is calculated as: property purchase price multiplied by 8.2%, divided by 12. For a property acquired at €400,000, that is €2,733 per month. The rate is fixed for the 60-month term of the programme.',
      },
      {
        q: 'What is the Entry Stake?',
        a: 'The Entry Stake is 1% of the property purchase price, paid once at the sale agreed stage. For a €400,000 property, it is €4,000. It establishes your 1% beneficial interest in the property. It is equity at risk: if you exit the programme, it is not refunded as cash. It is not a deposit in the mortgage sense.',
      },
      {
        q: 'Is the option price guaranteed?',
        a: 'The option price is contractually fixed on the day Homeown acquires the property and does not change over the 60-month term. It is not subject to market adjustments, valuation changes, or renegotiation. However, your ability to purchase at that price depends on securing a regulated mortgage through an independent lender at the end of the term. That mortgage approval is not guaranteed by Homeown.',
      },
      {
        q: 'Is this rent-to-buy?',
        a: 'No. Rent-to-buy schemes involve a rental agreement with an option to purchase later. Homeown is structurally different: there is no tenancy agreement, no landlord-tenant relationship, and no rental income flowing to Homeown. You hold a beneficial interest in the property from day one. The monthly fee is a service fee, not rent.',
      },
    ],
  },
  {
    heading: 'The structure',
    faqs: [
      {
        q: 'Who owns the property?',
        a: 'Legal title to the property is held by a Designated Activity Company (DAC), a separate legal entity established specifically for your property cohort. Homeown Limited does not hold legal title. The DAC is funded by third-party capital providers and is operationally passive: Homeown manages it as servicer.',
      },
      {
        q: "What is Homeown's role?",
        a: 'Homeown Limited is the servicer. It collects the monthly service fee, manages programme governance, coordinates property acquisition, and facilitates the exit or completion process at the end of the term. It is not a lender, not a landlord, and not a mortgage provider.',
      },
      {
        q: 'Is Homeown regulated?',
        a: 'Homeown is structured to operate outside the regulatory perimeter for retail credit and residential tenancies because the programme is not a credit product and does not involve a tenancy agreement. This is not the same as being unregulated: it means the programme is deliberately and demonstrably different from regulated products in both structure and substance. The structure has been designed with legal counsel. If you have questions about the regulatory position, the Key Facts Sheet and the Homeown Pathway Agreement provide the full detail.',
      },
      {
        q: 'Who provides the capital to acquire each property?',
        a: 'Each property cohort is funded by a combination of senior capital from institutional lenders and subordinated capital from a private group of invited investors. These capital providers are separate from Homeown Limited. Their capital is held at DAC level, not by Homeown.',
      },
    ],
  },
  {
    heading: 'Eligibility and process',
    faqs: [
      {
        q: 'Who is the programme for?',
        a: 'The programme is for first-time buyers in Ireland who can sustain mortgage-level monthly service fee payments over 60 months and who have the gross household income to support a regulated mortgage at the option price at the end of the term. It is not for everyone. The calculator will tell you clearly whether your situation fits.',
      },
      {
        q: 'How does the programme fit check work?',
        a: 'The calculator checks whether the property price you are targeting is within the range that your gross household income can support under standard Irish Central Bank mortgage lending rules (4 times gross household income for the regulated mortgage you would need at the end of the term). It is not a credit assessment and it does not check whether you can afford the monthly service fee. It takes two minutes.',
      },
      {
        q: 'Will my credit history be checked?',
        a: 'Homeown does not run a credit check at entry. The programme participation assessment checks income verification and payment operability only, not creditworthiness. A credit assessment will be conducted by the independent regulated lender you choose when you arrange your mortgage at the end of the 60-month term.',
      },
      {
        q: 'What documents are required?',
        a: 'Standard income evidence: payslips (3 months minimum), bank statements (6 months), and proof of identity and address. For self-employed applicants: accounts, tax documentation, and an accountant letter. Documents are used to verify income consistency and confirm that the monthly service fee is operationally feasible. They are not used to assess creditworthiness.',
      },
      {
        q: 'What areas does Homeown operate in?',
        a: 'Homeown currently accepts participants across the Republic of Ireland. Property acquisition spans all counties. Dublin properties are tracked at postcode level given the size and concentration of the market.',
      },
    ],
  },
  {
    heading: 'Risks and exit',
    faqs: [
      {
        q: 'What are the main risks I should understand?',
        a: 'The Entry Stake is equity at risk. If you exit the programme before the end of the term, it is not refunded as cash. The 60-month term is fixed: there is no early completion pathway. Mortgage approval at the end of the term is not guaranteed by Homeown. It depends on an independent lender\'s assessment of your circumstances at that time. If you cannot arrange a mortgage and choose not to exercise your option, you exit without owning the property, and your Entry Stake remains at risk.',
      },
      {
        q: 'What happens if I miss a monthly service fee payment?',
        a: 'The programme has a defined payment governance structure. A single missed payment does not automatically end the programme. There are cure windows and a defined process for addressing payment difficulties. Persistent non-payment will result in a breach notice and, ultimately, programme cancellation. The full payment governance structure is set out in the Homeown Pathway Agreement, which you receive and review before signing.',
      },
      {
        q: 'Can I leave the programme early?',
        a: 'Yes. You can exit at any time with 30 days notice. There is no ongoing debt to Homeown on exit. Your Entry Stake is equity at risk and is not refunded as cash.',
      },
      {
        q: 'What if I do not want to buy at the end of the term?',
        a: 'You give notice that you are not exercising your option. The programme ends. There is no debt owed to Homeown. Your Entry Stake is equity at risk.',
      },
      {
        q: 'What if the property market changes significantly over the 60 months?',
        a: 'Your option price is fixed on day one and does not change. If the market rises, the benefit of that growth is available to you when you exercise your option at the fixed price. If the market falls significantly, you are not obligated to purchase at the option price. You can choose to exit.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-normal tracking-tight">Frequently asked questions</h1>
        <p className="mt-4 text-muted-foreground">
          Plain-English answers to common questions about the Homeown pathway.
        </p>

        <div className="mt-12 space-y-10">
          {GROUPS.map(group => (
            <div key={group.heading}>
              <h2 className="mb-3 text-lg font-semibold">{group.heading}</h2>
              <Accordion type="single" collapsible className="divide-y rounded border px-4">
                {group.faqs.map(faq => (
                  <AccordionItem key={faq.q} value={faq.q} className="border-none">
                    <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-16 rounded border bg-brand-cream-light p-8 text-center">
          <h2 className="text-xl font-normal">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The best place to get answers specific to your situation is a 20-minute discovery call. Start by checking your numbers.
          </p>
          <Button asChild size="lg" className="mt-6">
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
