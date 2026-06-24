import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn, formatCurrency } from '@/lib/utils'
import { CalendarDays, Phone, AlertTriangle, ArrowRight } from 'lucide-react'
import type { LeadStage, ProgrammeStage } from '@/types'

// ─── Stage messaging ──────────────────────────────────────────────────────────

const LEAD_INFO: Record<LeadStage | 'null', { label: string; nextStep: string }> = {
  null:         { label: 'Getting Started', nextStep: "Your account is being set up. We'll be in touch shortly." },
  new_lead:     { label: 'Getting Started', nextStep: "We've received your details. Look out for an email from our team to book your discovery call." },
  in_discovery: { label: 'In Discovery',   nextStep: "We're learning about your situation. Your advisor will follow up after your call." },
  pre_qual:     { label: 'Pre-Qualification', nextStep: "We're completing your pre-qualification. We'll be in touch with the outcome shortly." },
  in_review:    { label: 'Under Review',   nextStep: "Your documents are being reviewed by our team. We'll be in touch with any questions." },
  eligible:     { label: 'Eligible',       nextStep: "Great news — you're eligible. Our team will assign you to a property cohort shortly." },
  not_eligible: { label: 'Application Closed', nextStep: 'Unfortunately your application did not meet our current criteria. Our team will be in touch.' },
  deferred:     { label: 'On Hold',        nextStep: "We've noted your interest for a future date. We'll be in touch when the time is right." },
}

const PROGRAMME_INFO: Record<ProgrammeStage, { label: string; nextStep: string }> = {
  dac_assigned:    { label: 'Property Search', nextStep: 'Your property search is beginning. Our team will support you in finding the right home.' },
  searching:       { label: 'Searching',       nextStep: "You're actively searching. Once you have sale agreed on a property, let us know." },
  sale_agreed:     { label: 'Sale Agreed',     nextStep: "Your property has been submitted. We're progressing your case with the legal team." },
  conveyancing:    { label: 'Conveyancing',    nextStep: "Legal work is underway. We'll keep you updated as things progress." },
  contracts_signed:{ label: 'Contracts Signed',nextStep: 'Contracts are in place. Completion is being arranged.' },
  in_home:         { label: 'In Home',         nextStep: "You're in your home. Keep your insurance and monthly service fee up to date." },
  servicing:       { label: 'Pathway Active',  nextStep: 'Your pathway is active. Keep your insurance and payments up to date.' },
  exit_prep:       { label: 'Exit Preparation',nextStep: "We're preparing for the option window. Our team will be in contact to walk through next steps." },
  option_window:   { label: 'Option Window',   nextStep: "Your option window is now open. Contact us to begin the purchase process." },
  pathway_complete:{ label: 'Pathway Complete',nextStep: "Congratulations — you've completed the Homeown pathway and own your home!" },
  exited:          { label: 'Exited',          nextStep: 'Your pathway has ended. Thank you for being part of Homeown.' },
}

const STEPPER_STEPS = ['Getting Started', 'Eligible', 'Property', 'Contracts', 'In Home']

function getStepperIndex(leadStage: LeadStage, programmeStage: ProgrammeStage | null): number {
  if (programmeStage) {
    if (['dac_assigned', 'searching', 'sale_agreed'].includes(programmeStage)) return 2
    if (['conveyancing', 'contracts_signed'].includes(programmeStage)) return 3
    if (['in_home', 'servicing', 'exit_prep', 'option_window', 'pathway_complete'].includes(programmeStage)) return 4
  }
  if (leadStage === 'eligible') return 1
  return 0
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }),
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { client } = useAuth()

  const { data: snapshot } = useQuery({
    queryKey: ['client-snapshot', client?.id],
    queryFn: async () => {
      if (!client) return null
      const { data } = await supabase
        .from('calculator_snapshots')
        .select('property_price, ghi, current_housing_cost, monthly_savings, current_savings')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!client,
  })

  const { data: pendingDocs } = useQuery({
    queryKey: ['client-pending-docs', client?.id],
    queryFn: async () => {
      if (!client) return { uploads: 0, acks: 0 }
      const [{ data: reqs }, { data: delivs }] = await Promise.all([
        supabase.from('document_requests').select('id').eq('client_id', client.id).in('status', ['requested', 'rejected']),
        supabase.from('document_deliveries').select('id').eq('client_id', client.id).eq('visible_in_portal', true).eq('requires_ack', true).is('acknowledged_at', null),
      ])
      return { uploads: (reqs ?? []).length, acks: (delivs ?? []).length }
    },
    enabled: !!client,
  })

  if (!client) return <div className="p-8 text-muted-foreground">Loading…</div>

  const info = client.programme_stage
    ? PROGRAMME_INFO[client.programme_stage]
    : LEAD_INFO[client.lead_stage ?? 'null']
  const stepperIndex = getStepperIndex(client.lead_stage, client.programme_stage)

  // Numbers from snapshot
  const price = snapshot?.property_price ?? 0
  const entryStake = Math.round(price * 0.01)
  const monthlyFee = Math.round((price * 0.082) / 12)
  const optionPrice = Math.round(price * 0.90)
  const hasNumbers = price > 0

  const hasCall = !!client.appointment_at
  const callDt = hasCall ? fmtDateTime(client.appointment_at!) : null

  const hasActions = (pendingDocs?.uploads ?? 0) > 0 || (pendingDocs?.acks ?? 0) > 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {client.first_name}</h1>
        <p className="mt-1 text-muted-foreground">Here's where things stand on your Homeown pathway.</p>
      </div>

      {/* Action needed */}
      {hasActions && (
        <Alert className="border-brand-burgundy/30 bg-brand-burgundy-muted">
          <AlertTriangle className="h-4 w-4 text-brand-burgundy" />
          <AlertDescription className="text-brand-burgundy flex items-center justify-between gap-3 flex-wrap">
            <span>
              {[
                (pendingDocs?.uploads ?? 0) > 0 && `${pendingDocs!.uploads} document${pendingDocs!.uploads > 1 ? 's' : ''} to upload`,
                (pendingDocs?.acks ?? 0) > 0 && `${pendingDocs!.acks} document${pendingDocs!.acks > 1 ? 's' : ''} to acknowledge`,
              ].filter(Boolean).join(' · ')}
            </span>
            <Button size="sm" variant="outline" asChild className="border-brand-burgundy/40 text-brand-burgundy hover:bg-brand-burgundy-muted shrink-0">
              <Link to="/app/client/documents">Go to documents <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pathway progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Your pathway</CardTitle>
            <Badge variant="secondary">{info.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
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
          <p className="text-sm text-muted-foreground border-t pt-4">{info.nextStep}</p>
        </CardContent>
      </Card>

      {/* Your numbers */}
      {hasNumbers && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Your numbers</CardTitle>
              <Link to="/app/client/pathway" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Full breakdown <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Entry Stake', value: formatCurrency(entryStake) },
                { label: 'Monthly service fee', value: formatCurrency(monthlyFee) },
                { label: 'Option price', value: formatCurrency(optionPrice) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold tabular-nums text-primary">{value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground border-t pt-3">
              Based on a property price of {formatCurrency(price)}. Your numbers are locked once your pathway begins.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discovery call */}
      {hasCall && (
        <Card>
          <CardHeader><CardTitle className="text-base">Discovery call</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{callDt!.date}</p>
                <p className="text-sm text-muted-foreground">{callDt!.time}</p>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">We'll call you on <span className="text-foreground font-medium">{client.phone}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
