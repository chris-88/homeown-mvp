import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeadStage, ProgrammeStage } from '@/types'

// ─── Client-facing status messages ───────────────────────────────────────────
const LEAD_INFO: Record<LeadStage | 'null', { label: string; nextStep: string }> = {
  null:         { label: 'Getting Started', nextStep: "Your account is being set up. We'll be in touch shortly." },
  new_lead:     { label: 'Getting Started', nextStep: "Your account is being set up. We'll be in touch shortly." },
  in_discovery: { label: 'In Discovery',   nextStep: "We're getting to know your situation. Look out for a call from our team." },
  pre_qual:     { label: 'Pre-Qualification', nextStep: "We're assessing your pre-qualification. We'll be in touch with the outcome." },
  in_review:    { label: 'Under Review',   nextStep: "Your documents are being reviewed by our team." },
  eligible:     { label: 'Eligible',       nextStep: "Great news — you're eligible for Homeown. Our team will assign you to a property cohort shortly." },
  not_eligible: { label: 'Application Closed', nextStep: 'Unfortunately your application did not meet our current criteria. Our team will contact you with more details.' },
  deferred:     { label: 'Deferred',       nextStep: "We've noted your interest for a future date. Our team will be in touch when the time is right." },
}

const PROGRAMME_INFO: Record<ProgrammeStage, { label: string; nextStep: string }> = {
  dac_assigned:    { label: 'Property Search Starting', nextStep: 'Your property search is beginning. Our purchasing team will help you find the right home.' },
  searching:       { label: 'Searching',       nextStep: "You're actively searching. When you find a property and have sale agreed, let us know." },
  sale_agreed:     { label: 'Sale Agreed',     nextStep: "Your property has been submitted. We're progressing your case." },
  conveyancing:    { label: 'Conveyancing',    nextStep: "Legal work is underway. We'll keep you updated as things progress." },
  contracts_signed:{ label: 'Contracts Signed',nextStep: 'Contracts are in place. Completion is being arranged.' },
  in_home:         { label: 'In Home',         nextStep: "You're in your home! Keep your insurance and monthly service fee up to date." },
  servicing:       { label: 'Pathway Active',  nextStep: 'Your pathway is active. Keep your insurance and payments up to date.' },
  exit_prep:       { label: 'Exit Preparation',nextStep: "We're preparing for the option window. Our team will be in contact to walk through next steps." },
  option_window:   { label: 'Option Window',   nextStep: "Your option window is now open. Contact us to begin the purchase process." },
  pathway_complete:{ label: 'Pathway Complete',nextStep: "Congratulations — you've completed the Homeown pathway and own your home!" },
  exited:          { label: 'Exited',          nextStep: 'Your pathway has ended. Thank you for being part of Homeown.' },
}

const STEPPER_STEPS = ['Getting Started', 'Eligible', 'Property', 'Contracts', 'In Home']

function getStepperIndex(leadStage: LeadStage, programmeStage: ProgrammeStage | null): number {
  if (programmeStage) {
    if (['dac_assigned','searching','sale_agreed'].includes(programmeStage)) return 2
    if (['conveyancing','contracts_signed'].includes(programmeStage)) return 3
    if (['in_home','servicing','exit_prep','option_window','pathway_complete'].includes(programmeStage)) return 4
  }
  if (leadStage === 'eligible') return 1
  if (['in_review','pre_qual','in_discovery'].includes(leadStage)) return 0
  return 0
}

export default function ClientDashboard() {
  const { client } = useAuth()
  if (!client) return <div className="p-8 text-muted-foreground">Loading…</div>

  const info = client.programme_stage
    ? PROGRAMME_INFO[client.programme_stage]
    : LEAD_INFO[client.lead_stage ?? 'null']

  const stepperIndex = getStepperIndex(client.lead_stage, client.programme_stage)

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
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0',
                    i < stepperIndex ? 'bg-primary text-primary-foreground' :
                    i === stepperIndex ? 'border-2 border-primary text-primary' :
                    'border-2 border-border text-muted-foreground',
                  )}>
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
