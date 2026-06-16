import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import {
  LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS,
} from '@/types'
import type { Client, CircleMember, Dac, Subscription } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function StaleBadge({ days, threshold }: { days: number; threshold: number }) {
  if (days < threshold) return null
  return <Badge variant="destructive" className="text-xs">{days}d</Badge>
}

function ProspectRow({ client }: { client: Client }) {
  const days = daysAgo(client.updated_at)
  return (
    <Link
      to={`/app/staff/prospects/${client.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors"
    >
      <div>
        <p className="text-sm font-medium">{client.first_name} {client.last_name}</p>
        <p className="text-xs text-muted-foreground">{LEAD_STAGE_LABELS[client.lead_stage]}</p>
      </div>
      <StaleBadge days={days} threshold={3} />
    </Link>
  )
}

const PHASE2_STAGES = ['dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed']

function ClientRow({ client }: { client: Client }) {
  const days = daysAgo(client.updated_at)
  const stageLabel = client.programme_stage
    ? PROGRAMME_STAGE_LABELS[client.programme_stage]
    : LEAD_STAGE_LABELS[client.lead_stage]
  const section = client.programme_stage && PHASE2_STAGES.includes(client.programme_stage) ? 'property' : 'pathway'
  return (
    <Link
      to={`/app/staff/${section}/${client.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors"
    >
      <div>
        <p className="text-sm font-medium">{client.first_name} {client.last_name}</p>
        <p className="text-xs text-muted-foreground">{stageLabel}</p>
      </div>
      <StaleBadge days={days} threshold={7} />
    </Link>
  )
}

// ─── Admin Queue ───────────────────────────────────────────────────────────────
function AdminQueue() {
  const { data: allProspects } = useQuery<Client[]>({
    queryKey: ['queue-admin-prospects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .is('dac_id', null)
        .not('lead_stage', 'in', '(not_eligible,deferred)')
        .order('updated_at', { ascending: true })
      return (data ?? []) as Client[]
    },
  })

  const { data: eligibleCount } = useQuery<number>({
    queryKey: ['queue-admin-eligible'],
    queryFn: async () => {
      const { count } = await supabase
        .from('clients').select('*', { count: 'exact', head: true })
        .eq('lead_stage', 'eligible').is('dac_id', null)
      return count ?? 0
    },
  })

  const { data: phase2Clients } = useQuery<Client[]>({
    queryKey: ['queue-admin-phase2'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .not('dac_id', 'is', null)
        .not('programme_stage', 'in', '(pathway_complete,exited)')
        .order('updated_at', { ascending: true })
      return (data ?? []) as Client[]
    },
  })

  const staleProspects = (allProspects ?? []).filter(c => daysAgo(c.updated_at) >= 3).length
  const staleClients   = (phase2Clients ?? []).filter(c => daysAgo(c.updated_at) >= 7).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Onboarding: stale</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{staleProspects}</p><p className="text-xs text-muted-foreground">Prospects not updated in 3+ days</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Finance: eligible</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{eligibleCount ?? '-'}</p><p className="text-xs text-muted-foreground">Awaiting DAC assignment</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Property: stale</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{staleClients}</p><p className="text-xs text-muted-foreground">Clients not updated in 7+ days</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total active</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(allProspects?.length ?? 0) + (phase2Clients?.length ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Across all phases</p>
          </CardContent>
        </Card>
      </div>
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        As admin you can view and manage all records from{' '}
        <Link to="/app/staff/prospects" className="underline underline-offset-2">Prospects</Link>,{' '}
        <Link to="/app/staff/property" className="underline underline-offset-2">Property</Link> and{' '}
        <Link to="/app/staff/pathway" className="underline underline-offset-2">Pathway</Link>.
      </div>
    </div>
  )
}

// ─── Onboarding Queue ──────────────────────────────────────────────────────────
function OnboardingQueue({ staffId }: { staffId: string }) {
  const { data: assigned } = useQuery<Client[]>({
    queryKey: ['queue-onboarding', staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .eq('assigned_to', staffId)
        .is('dac_id', null)
        .not('lead_stage', 'in', '(not_eligible,deferred)')
        .order('updated_at', { ascending: true })
      return (data ?? []) as Client[]
    },
  })

  const { data: unassigned } = useQuery<Client[]>({
    queryKey: ['queue-onboarding-unassigned'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .is('assigned_to', null)
        .is('dac_id', null)
        .not('lead_stage', 'in', '(not_eligible,deferred,eligible)')
        .order('created_at', { ascending: true })
        .limit(10)
      return (data ?? []) as Client[]
    },
  })

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold">My prospects ({assigned?.length ?? 0})</h2>
        {assigned?.length === 0 && <p className="text-sm text-muted-foreground">No prospects assigned to you.</p>}
        {assigned?.map(c => <ProspectRow key={c.id} client={c} />)}
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Unassigned leads</h2>
        {unassigned?.length === 0 && <p className="text-sm text-muted-foreground">None waiting.</p>}
        {unassigned?.map(c => (
          <Link key={c.id} to={`/app/staff/prospects/${c.id}`}
            className="block rounded-lg border bg-card px-4 py-3 hover:bg-accent text-sm">
            <p className="font-medium">{c.first_name} {c.last_name}</p>
            <p className="text-muted-foreground text-xs">{LEAD_STAGE_LABELS[c.lead_stage]} · {daysAgo(c.created_at)}d ago</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Finance Queue ─────────────────────────────────────────────────────────────
function FinanceQueue() {
  const { data: eligible } = useQuery<Client[]>({
    queryKey: ['queue-finance-eligible'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .eq('lead_stage', 'eligible').is('dac_id', null)
        .order('updated_at', { ascending: true })
      return (data ?? []) as Client[]
    },
  })

  const { data: openDacs } = useQuery<(Dac & { subscriptions: Pick<Subscription,'amount'|'status'>[] })[]>({
    queryKey: ['queue-finance-dacs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs').select('*, subscriptions(amount,status)')
        .eq('status', 'open')
      return (data ?? []) as (Dac & { subscriptions: Pick<Subscription,'amount'|'status'>[] })[]
    },
  })

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold">Eligible: awaiting DAC ({eligible?.length ?? 0})</h2>
        {eligible?.length === 0 && <p className="text-sm text-muted-foreground">No eligible prospects awaiting assignment.</p>}
        {eligible?.map(c => <ProspectRow key={c.id} client={c} />)}
      </div>
      <div className="space-y-4">
        <h2 className="font-semibold text-sm">Open DACs</h2>
        {openDacs?.length === 0 && <p className="text-sm text-muted-foreground">No open DACs.</p>}
        {openDacs?.map(d => {
          const raised = d.subscriptions.filter(s => !['soft_commit','withdrawn'].includes(s.status)).reduce((s,x) => s+x.amount, 0)
          const target = d.target_sub_amount ?? 0
          const pct = target > 0 ? Math.min(100, Math.round((raised/target)*100)) : 0
          return (
            <Link key={d.id} to={`/app/staff/dacs/${d.id}`} className="block space-y-1.5 rounded-lg border bg-card p-3 hover:bg-accent">
              <p className="text-sm font-medium">{d.name}</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(raised)} / {target ? formatCurrency(target) : '-'}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── Purchasing Agent Queue ────────────────────────────────────────────────────
function PurchasingAgentQueue({ staffId }: { staffId: string }) {
  const { data: assigned } = useQuery<Client[]>({
    queryKey: ['queue-purchasing', staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .eq('assigned_to', staffId)
        .not('programme_stage', 'is', null)
        .in('programme_stage', ['dac_assigned','searching','sale_agreed','conveyancing','contracts_signed'])
        .order('updated_at', { ascending: true })
      return (data ?? []) as Client[]
    },
  })

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">My Phase 2 clients ({assigned?.length ?? 0})</h2>
      {assigned?.length === 0 && <p className="text-sm text-muted-foreground">No Phase 2 clients assigned to you.</p>}
      {assigned?.map(c => <ClientRow key={c.id} client={c} />)}
    </div>
  )
}

// ─── Client Success Queue ──────────────────────────────────────────────────────
function ClientSuccessQueue({ staffId }: { staffId: string }) {
  const { data: assigned } = useQuery<Client[]>({
    queryKey: ['queue-client-success', staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients').select('*')
        .eq('assigned_to', staffId)
        .in('programme_stage', ['in_home','servicing','exit_prep','option_window'])
        .order('updated_at', { ascending: true })
      return (data ?? []) as Client[]
    },
  })

  const exitPrep = (assigned ?? []).filter(c => c.programme_stage === 'exit_prep').length
  const optionWindow = (assigned ?? []).filter(c => c.programme_stage === 'option_window').length

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold">My pathway clients ({assigned?.length ?? 0})</h2>
        {assigned?.length === 0 && <p className="text-sm text-muted-foreground">No pathway clients assigned to you.</p>}
        {assigned?.map(c => <ClientRow key={c.id} client={c} />)}
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{exitPrep}</p>
          <p className="text-sm text-muted-foreground">Exit prep</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{optionWindow}</p>
          <p className="text-sm text-muted-foreground">Option window active</p>
        </div>
      </div>
    </div>
  )
}

// ─── Circle Relations Queue ────────────────────────────────────────────────────
function CircleRelationsQueue({ staffId }: { staffId: string }) {
  const { data: assigned } = useQuery<(CircleMember & { subscriptions: Pick<Subscription,'status'|'amount'>[] })[]>({
    queryKey: ['queue-circle-relations', staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_members').select('*, subscriptions(status,amount)')
        .eq('assigned_to', staffId)
        .order('updated_at', { ascending: true })
      return (data ?? []) as (CircleMember & { subscriptions: Pick<Subscription,'status'|'amount'>[] })[]
    },
  })

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">My Circle members ({assigned?.length ?? 0})</h2>
      {assigned?.length === 0 && <p className="text-sm text-muted-foreground">No Circle members assigned to you.</p>}
      {assigned?.map(m => {
        const activeTotal = m.subscriptions
          .filter(s => !['soft_commit','withdrawn'].includes(s.status))
          .reduce((sum, s) => sum + s.amount, 0)
        const softCount = m.subscriptions.filter(s => s.status === 'soft_commit').length
        return (
          <Link key={m.id} to={`/app/staff/circle/${m.id}`}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors">
            <div>
              <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
              <p className="text-xs text-muted-foreground">
                {activeTotal > 0 ? formatCurrency(activeTotal) + ' committed' : 'No active subscriptions'}
                {softCount > 0 ? ` · ${softCount} soft commit` : ''}
              </p>
            </div>
            {m.kyc_status !== 'complete' && (
              <Badge variant="secondary" className="text-xs">KYC {m.kyc_status}</Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function QueuePage() {
  const { staffMember } = useAuth()
  const role = staffMember?.role

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">My Queue</h1>
        <p className="mt-1 text-muted-foreground">
          {staffMember ? `${staffMember.first_name} · ${staffMember.role.replace('_', ' ')}` : 'Loading…'}
        </p>
      </div>

      {role === 'admin'             && <AdminQueue />}
      {role === 'onboarding'        && staffMember && <OnboardingQueue staffId={staffMember.id} />}
      {role === 'finance'           && <FinanceQueue />}
      {role === 'purchasing_agent'  && staffMember && <PurchasingAgentQueue staffId={staffMember.id} />}
      {role === 'client_success'    && staffMember && <ClientSuccessQueue staffId={staffMember.id} />}
      {role === 'circle_relations'  && staffMember && <CircleRelationsQueue staffId={staffMember.id} />}

      {!staffMember && (
        <div className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <p>Your staff profile could not be found.</p>
          <p className="mt-1">Ask an admin to check your staff_members record is linked to your account.</p>
        </div>
      )}
    </div>
  )
}
