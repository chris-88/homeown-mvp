import { useState } from 'react'
import { PublicNav } from '@/components/shared/PublicNav'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'Is this rent-to-buy?',
    a: 'No. Homeown is a property ownership pathway. You hold 1% beneficial interest from the day of legal completion ,you are a property owner from the start, not a tenant.',
  },
  {
    q: 'What is the monthly service fee (Domiter)?',
    a: 'The monthly service fee covers the cost of the programme and is calculated at 8.2% of the property price per year, divided by 12. It is not rent and not a credit repayment.',
  },
  {
    q: 'What is the entry stake?',
    a: 'The entry stake is 1% of the property price, payable at legal completion. It represents your initial beneficial interest in the property.',
  },
  {
    q: 'Do I need a mortgage?',
    a: 'You do not need a mortgage to enter the Homeown programme. At the end of the 60-month term, you have the option ,but not the obligation ,to purchase the remaining 99% via a standard regulated mortgage.',
  },
  {
    q: 'What happens at the end of the 60 months?',
    a: 'You have the right to purchase the remaining 99% of the property at a fixed price that is 10% below the original purchase price. This requires a standard mortgage from an independent regulated lender. If you choose not to exercise the option, you are not obligated to purchase.',
  },
  {
    q: 'What is a programme participation assessment?',
    a: 'This is our eligibility review ,we assess your income, employment, and household circumstances to determine if the Homeown programme is suitable for you. It is not a credit assessment and does not affect your credit file.',
  },
  {
    q: 'Which properties are eligible?',
    a: 'Residential properties in the Republic of Ireland priced between €200,000 and €700,000. Properties must be suitable for owner-occupation.',
  },
  {
    q: 'Can I leave the programme early?',
    a: 'Your agreement will set out the terms for early exit. Contact our team to discuss your circumstances.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium hover:text-foreground"
      >
        {q}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      <div className={cn('overflow-hidden text-sm text-muted-foreground transition-all', open ? 'pb-5' : 'max-h-0')}>
        {open && <p>{a}</p>}
      </div>
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
        <p className="mt-4 text-muted-foreground">Plain-English answers to common questions about the Homeown pathway.</p>
        <div className="mt-10 divide-y rounded-xl border px-6">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </main>
    </div>
  )
}
