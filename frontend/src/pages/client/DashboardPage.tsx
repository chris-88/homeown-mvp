import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProgrammeStage } from '@/types'
import { cn } from '@/lib/utils'

interface StageInfo { label: string; nextStep: string }

const STAGE_INFO: Record<string, StageInfo> = {
  null: { label: 'Getting Started', nextStep: "Your account is being set up. We'll send you next steps shortly." },
  onboarding_docs_requested: { label: 'Documents Requested', nextStep: 'Please upload your required documents.' },
  onboarding_under_review: { label: 'Documents Under Review', nextStep: "We're reviewing your documents. We'll be in touch shortly." },
  limit_letter_ready: { label: 'Eligible', nextStep: 'Your Homeown Eligibility Letter is ready. You can now begin your property search.' },
  searching: { label: 'Searching', nextStep: "You're eligible to proceed. When you find a property and have sale agreed, submit it below." },
  sale_agreed: { label: 'Sale Agreed', nextStep: "Your property has been submitted. We're progressing your case." },
  approval_notice_issued: { label: 'Approval Confirmed', nextStep: 'Your property has been approved. Please confirm your insurance and direct debit.' },
  committed: { label: 'Committed', nextStep: 'Everything is in place. Completion is being arranged.' },
  in_home: { label: 'In Home', nextStep: "You're in your home. Keep your insurance and monthly service fee up to date." },
  servicing_active: { label: 'Pathway Active', nextStep: 'Your pathway is active. Keep your insurance and payments up to date.' },
}

const STEPPER_STEPS = ['Registered', 'Documents', 'Eligible', 'Property', 'Contracts', 'In Home']

function getStepperIndex(stage: ProgrammeStage | null): number {
  if (!stage) return 0
  if (['onboarding_docs_requested', 'onboarding_under_review'].includes(stage)) return 1
  if (stage === 'limit_letter_ready') return 2
  if (['searching', 'sale_agreed', 'valuation_in_progress', 'approval_notice_issued'].includes(stage)) return 3
  if (stage === 'committed') return 4
  if (['in_home', 'servicing_active'].includes(stage)) return 5
  return 0
}

export default function ClientDashboard() {
  const { client } = useAuth()
  if (!client) return <div className="p-8 text-muted-foreground">Loading…</div>

  const stageKey = client.programme_stage ?? 'null'
  const info = STAGE_INFO[stageKey] ?? STAGE_INFO['null']
  const stepperIndex = getStepperIndex(client.programme_stage)

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {client.first_name}</h1>
        <p className="mt-1 text-muted-foreground">Here's where things stand on your Homeown pathway.</p>
      </div>

      {/* Stage card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current stage</CardTitle>
            <Badge variant="secondary">{info.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{info.nextStep}</p>
        </CardContent>
      </Card>

      {/* Progress stepper */}
      <Card>
        <CardHeader><CardTitle className="text-base">Your pathway progress</CardTitle></CardHeader>
        <CardContent>
          <ol className="flex items-center gap-0">
            {STEPPER_STEPS.map((step, i) => (
              <li key={step} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {i > 0 && <div className={cn('h-0.5 flex-1', i <= stepperIndex ? 'bg-primary' : 'bg-border')} />}
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0', i < stepperIndex ? 'bg-primary text-primary-foreground' : i === stepperIndex ? 'border-2 border-primary text-primary' : 'border-2 border-border text-muted-foreground')}>
                    {i < stepperIndex ? '✓' : i + 1}
                  </div>
                  {i < STEPPER_STEPS.length - 1 && <div className={cn('h-0.5 flex-1', i < stepperIndex ? 'bg-primary' : 'bg-border')} />}
                </div>
                <span className="mt-2 text-center text-xs text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
