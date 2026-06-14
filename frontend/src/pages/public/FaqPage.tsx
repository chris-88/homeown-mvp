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
        a: 'No. The monthly service fee is not rent, and there is no tenancy agreement between you and Homeown. From the moment you complete your entry stake, you own a 1% share of the property — a beneficial interest — and have a contractual right to purchase the rest. The monthly payment is the fee for operating that pathway, not a payment for occupying the property.',
      },
      {
        q: 'How is the monthly service fee calculated?',
        a: 'The fee is: property purchase price × 8.2% ÷ 12. For a €400,000 property, that is €2,733 per month. The rate is fixed for the full term of the programme — it does not change.',
      },
      {
        q: 'Is the purchase price guaranteed?',
        a: 'Yes. The purchase price is fixed in the pathway agreement at the moment Homeown buys the property, set at 10% below what Homeown paid. It does not change over the 60-month term — no market adjustments, no renegotiation.',
      },
      {
        q: 'What is the entry stake?',
        a: 'The entry stake is 1% of the property purchase price, paid once at the sale agreed stage. It gives you a 1% ownership share in the property from day one. It is equity at risk: if you exit the programme, it is not refunded as cash. It is not a deposit in the traditional sense — it is your stake in the property.',
      },
      {
        q: 'Is this rent-to-buy?',
        a: 'No. Rent-to-buy schemes involve a rental agreement with an option to purchase later. Homeown is different in both structure and substance: there is no tenancy agreement, no landlord-tenant relationship, and no rental income. You own a share of the property from day one. The monthly fee is not rent.',
      },
    ],
  },
  {
    heading: 'The structure',
    faqs: [
      {
        q: 'Who owns the property?',
        a: 'Legal title is held by a separate company — a Designated Activity Company (DAC) — set up specifically for your property. Homeown Limited does not own the property. The DAC holds the property and nothing else; it is funded by third-party investors. Homeown manages the programme as servicer.',
      },
      {
        q: 'What is Homeown\'s role?',
        a: 'Homeown Limited is the servicer. It collects monthly service fees, manages the programme, coordinates property acquisition, and handles the purchase or exit process at the end of the term. It is not a lender, not a landlord, and not a mortgage provider.',
      },
      {
        q: 'Is Homeown regulated?',
        a: 'The programme is designed so that it does not fall under the regulations that apply to mortgage lenders or to landlords — because Homeown does not lend money and there is no tenancy. The structure has been reviewed by legal counsel. This is not the same as being unregulated: it means the programme is deliberately built to be different from those products, and that difference is clearly documented.',
      },
      {
        q: 'Who funds the property acquisition?',
        a: 'Each property is funded by a combination of senior debt (from institutional lenders) and junior investment (from a private group of invited investors). These investors are entirely separate from Homeown Limited. Their investment sits at the level of the property company (DAC), not with Homeown.',
      },
    ],
  },
  {
    heading: 'Eligibility and process',
    faqs: [
      {
        q: 'Who is the programme for?',
        a: 'The programme is for first-time buyers who can sustain mortgage-level monthly payments but have not yet built up enough capital to enter through a standard mortgage. It is not for everyone. The calculator will tell you whether the pathway fits your situation.',
      },
      {
        q: 'How does the programme fit check work?',
        a: 'The calculator checks whether the property price you are targeting is within reach of a standard mortgage at the end of 60 months — using typical Irish bank lending rules, currently around 3.5× your gross household income. It is not a credit check. It does not assess whether you can afford the monthly service fee; that is your decision. The full check takes two minutes.',
      },
      {
        q: 'Will my credit rating be checked?',
        a: 'Homeown does not run a credit check at entry. The entry assessment checks that your income is consistent and that the monthly payment is genuinely within your means — nothing more. A full credit and affordability assessment will be carried out by the independent bank of your choice when you arrange your mortgage at month 60.',
      },
      {
        q: 'What documents are required?',
        a: 'Standard income evidence: payslips, 6 months of bank statements, and proof of identity and address. For self-employed applicants: accounts, tax documentation, and an accountant\'s letter. These are used to confirm consistent income and that you can make the monthly payment — not to assess your creditworthiness.',
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
        a: 'The entry stake is equity at risk: if you exit before the end of the term, it is not returned as cash. The 60-month term is fixed — there is no early completion. Mortgage approval at the end of the term is not guaranteed by Homeown; it depends on an independent bank\'s assessment at that time. If you cannot arrange a mortgage at exit, you can choose not to buy, but the entry stake remains at risk.',
      },
      {
        q: 'What happens if I miss a payment?',
        a: 'A single missed payment does not end the programme. There are defined cure windows — periods during which you can catch up — and a clear process before any programme action is taken. Ongoing non-payment will eventually result in a breach and programme cancellation. The full details are set out in the Homeown Pathway Agreement.',
      },
      {
        q: 'Can I leave early?',
        a: 'Yes. You can exit the programme at any time with 30 days\' notice. There is no ongoing debt to Homeown on exit. Your entry stake is equity at risk and is not refunded as cash.',
      },
      {
        q: 'What happens at the end of the term if I don\'t want to buy?',
        a: 'You give notice that you are not exercising your option, and the programme ends. There is no debt owed to Homeown. Your entry stake is equity at risk.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-normal tracking-tight">Frequently asked questions</h1>
        <p className="mt-4 text-muted-foreground">Plain-English answers to common questions about the Homeown pathway.</p>

        <div className="mt-12 space-y-10">
          {GROUPS.map(group => (
            <div key={group.heading}>
              <h2 className="mb-2 text-lg font-semibold">{group.heading}</h2>
              <Accordion type="single" collapsible className="divide-y rounded border px-4">
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
        <div className="mt-16 rounded border bg-brand-cream-light p-8 text-center">
          <h2 className="text-xl font-normal">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The best way to get answers specific to your situation is a 20-minute discovery call. Start by checking your numbers.
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
