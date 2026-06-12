import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, FileCheck, TrendingUp, Key } from 'lucide-react'

const steps = [
  { icon: <TrendingUp className="h-6 w-6" />, title: 'Use the calculator', body: 'Enter a property price to see your monthly service fee, entry stake, and purchase option price.' },
  { icon: <FileCheck className="h-6 w-6" />, title: 'Complete your assessment', body: 'Submit your programme participation assessment documents. Our team reviews and confirms your eligibility.' },
  { icon: <Home className="h-6 w-6" />, title: 'Find your home', body: 'Search the market freely. When you have sale agreed, submit the property to us.' },
  { icon: <Key className="h-6 w-6" />, title: 'Move in, then buy', body: 'Hold 1% beneficial interest from day one. After 60 months you have the option to purchase the remaining 99% at a 10% discount.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Own your home from day one.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Homeown is a structured property ownership pathway. Pay a monthly service fee, hold 1% beneficial interest immediately, and exercise your option to buy after 60 months at a fixed discount.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/calc">Try the calculator</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </section>

        {/* Steps */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-12 text-center text-2xl font-semibold">The pathway in four steps</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {step.icon}
                    </div>
                    <h3 className="mb-2 font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="text-2xl font-semibold">Ready to see the numbers?</h2>
          <p className="mt-4 text-muted-foreground">Enter a property price and get your personalised figures in seconds.</p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/calc">Open the calculator</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Homeown. All rights reserved.</p>
        <p className="mt-1">Homeown does not provide mortgage credit. Monthly payments are a service fee, not rent and not credit repayments.</p>
      </footer>
    </div>
  )
}
