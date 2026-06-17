import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  DAC_STATUS_LABELS,
} from '@/types'
import type { Dac, Subscription } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Route, CheckCircle2, UserSearch, Users2, Landmark, TrendingUp,
  ChevronRight, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type PipelineRow = { stage: string; count: number }
type Metrics = {
  total_prospects: number
  eligible_unassigned: number
  on_pathway_count: number
  pathway_complete_count: number
  circle_member_count: number
  circle_kyc_complete: number
  total_committed: number
  total_funded: number
  open_dac_count: number
}

type DacWithRelations = Dac & {
  subscriptions: Pick<Subscription, 'amount' | 'status'>[]
  clients: { id: string; programme_stage: string | null }[]
}

const ACCENTS = {
  green:    { badge: 'bg-brand-green text-brand-cream', ring: 'group-hover:border-brand-green/40' },
  burgundy: { badge: 'bg-brand-burgundy text-brand-cream', ring: 'group-hover:border-brand-burgundy/40' },
  cream:    { badge: 'bg-brand-cream-light text-brand-ink', ring: 'group-hover:border-brand-cream/60' },
} as const

function StatCard({ label, value, sub, to, icon: Icon, accent = 'green' }: {
  label: string
  value: string | number
  sub?: string
  to?: string
  icon: LucideIcon
  accent?: keyof typeof ACCENTS
}) {
  const a = ACCENTS[accent]
  const content = (
    <div className="flex items-start gap-4">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', a.badge)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {to && <ChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/40 transition-colors group-hover:text-foreground" />}
    </div>
  )
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'group block rounded-md border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
          a.ring,
        )}
      >
        {content}
      </Link>
    )
  }
  return <div className="rounded-md border bg-card p-5 shadow-sm">{content}</div>
}

const PHASE1_COLOR = { border: 'border-border', bar: 'bg-muted-foreground/30' }
const PHASE2_COLOR = { border: 'border-brand-burgundy/20', bar: 'bg-brand-burgundy' }
const PHASE3_COLOR = { border: 'border-brand-green/25', bar: 'bg-brand-green' }

function StageBox({ stage, count, color, to }: {
  stage: string
  count: number
  color: { border: string; bar: string }
  to: string
}) {
  const label = LEAD_STAGE_LABELS[stage as keyof typeof LEAD_STAGE_LABELS] ??
    PROGRAMME_STAGE_LABELS[stage as keyof typeof PROGRAMME_STAGE_LABELS] ??
    stage
  return (
    <Link
      to={to}
      className={cn(
        'group relative flex-1 min-w-0 overflow-hidden rounded-lg border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm',
        color.border,
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-0.5', color.bar)} />
      <p className={`text-2xl font-bold tabular-nums ${count === 0 ? 'text-muted-foreground/30' : ''}`}>
        {count === 0 ? '-' : count}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </Link>
  )
}

function PhaseGroup({ label, stages, counts, color, basePath }: {
  label: string
  stages: string[]
  counts: Record<string, number>
  color: { border: string; bar: string }
  basePath: string
}) {
  const total = stages.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', color.bar)} />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-xs text-muted-foreground/60">· {total}</span>
      </div>
      <div className="flex gap-1.5">
        {stages.map(s => (
          <StageBox key={s} stage={s} count={counts[s] ?? 0} color={color} to={`${basePath}?stage=${s}`} />
        ))}
      </div>
    </div>
  )
}

function computeRaisedAmount(subscriptions: Pick<Subscription, 'amount' | 'status'>[]) {
  return subscriptions
    .filter(s => !['soft_commit','withdrawn'].includes(s.status))
    .reduce((sum, s) => sum + s.amount, 0)
}

export default function OverviewPage() {
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['overview-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_overview_metrics')
      if (error) throw error
      return data as Metrics
    },
  })

  const { data: pipeline } = useQuery<PipelineRow[]>({
    queryKey: ['pipeline-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pipeline_counts')
      if (error) throw error
      return (data as PipelineRow[]) ?? []
    },
  })

  const { data: dacs } = useQuery<DacWithRelations[]>({
    queryKey: ['overview-dacs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dacs')
        .select('*, subscriptions(amount,status), clients(id,programme_stage)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DacWithRelations[]
    },
  })

  const stageCounts: Record<string, number> = {}
  for (const row of pipeline ?? []) {
    stageCounts[row.stage] = (stageCounts[row.stage] ?? 0) + Number(row.count)
  }

  const planningDacs  = (dacs ?? []).filter(d => d.status === 'draft' || d.status === 'upcoming')
  const fundraisingDacs = (dacs ?? []).filter(d => d.status === 'open')
  const liveDacs      = (dacs ?? []).filter(d => d.status === 'closed')
  const maturedDacs   = (dacs ?? []).filter(d => d.status === 'matured')

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-muted-foreground">Pipeline health at a glance.</p>
      </div>

      {/* Mission numbers */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mission numbers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="On pathway"
            value={metrics?.on_pathway_count ?? '-'}
            sub="Families in their home"
            to="/app/staff/pathway"
            icon={Route}
            accent="green"
          />
          <StatCard
            label="Pathway complete"
            value={metrics?.pathway_complete_count ?? '-'}
            sub="Completed the programme"
            to="/app/staff/pathway?stage=pathway_complete"
            icon={CheckCircle2}
            accent="green"
          />
          <StatCard
            label="Active prospects"
            value={metrics?.total_prospects ?? '-'}
            sub={metrics ? `${metrics.eligible_unassigned} eligible, awaiting DAC` : undefined}
            to="/app/staff/prospects"
            icon={UserSearch}
            accent="burgundy"
          />
          <StatCard
            label="Circle members"
            value={metrics?.circle_member_count ?? '-'}
            sub={metrics ? `${metrics.circle_kyc_complete} KYC complete` : undefined}
            to="/app/staff/circle"
            icon={Users2}
            accent="cream"
          />
        </div>
      </section>

      {/* Pipeline funnel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline funnel</h2>
          <Link to="/app/staff/prospects" className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View all clients <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-4 rounded-md border bg-card p-5 shadow-sm">
          <PhaseGroup
            label="Phase 1: Discovery"
            stages={LEAD_STAGE_ORDER}
            counts={stageCounts}
            color={PHASE1_COLOR}
            basePath="/app/staff/prospects"
          />
          <PhaseGroup
            label="Phase 2: Property"
            stages={['dac_assigned','searching','sale_agreed','conveyancing','contracts_signed']}
            counts={stageCounts}
            color={PHASE2_COLOR}
            basePath="/app/staff/property"
          />
          <PhaseGroup
            label="Phase 3: Pathway"
            stages={['in_home','servicing','exit_prep','option_window','pathway_complete']}
            counts={stageCounts}
            color={PHASE3_COLOR}
            basePath="/app/staff/pathway"
          />
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Link to="/app/staff/prospects?stage=not_eligible" className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
              <span className="font-medium text-foreground">{stageCounts['not_eligible'] ?? 0}</span> not eligible
            </Link>
            <Link to="/app/staff/prospects?stage=deferred" className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
              <span className="font-medium text-foreground">{stageCounts['deferred'] ?? 0}</span> deferred
            </Link>
            <Link to="/app/staff/pathway?stage=exited" className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
              <span className="font-medium text-foreground">{stageCounts['exited'] ?? 0}</span> exited
            </Link>
          </div>
        </div>
      </section>

      {/* DAC Lifecycle */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">DAC lifecycle</h2>
          <Link to="/app/staff/dacs" className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View all DACs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Planning */}
          <div className="rounded-md border bg-card p-4 shadow-sm space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Planning</p>
            </div>
            {planningDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : planningDacs.map(d => (
              <Link key={d.id} to={`/app/staff/dacs/${d.id}`} className="block rounded-md -mx-2 px-2 py-1 text-sm transition-colors hover:bg-accent">
                <p className="font-medium">{d.name}</p>
                <p className="text-muted-foreground">{DAC_STATUS_LABELS[d.status]}</p>
              </Link>
            ))}
          </div>

          {/* Fundraising */}
          <div className="rounded-md border bg-card p-4 shadow-sm space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fundraising</p>
            </div>
            {fundraisingDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None open</p>
            ) : fundraisingDacs.map(d => {
              const raised = computeRaisedAmount(d.subscriptions)
              const target = d.target_sub_amount ?? 0
              const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0
              return (
                <Link key={d.id} to={`/app/staff/dacs/${d.id}`} className="block space-y-1.5 rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-accent">
                  <p className="text-sm font-medium">{d.name}</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(raised)} / {target ? formatCurrency(target) : '-'} ({pct}%)
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Live */}
          <div className="rounded-md border bg-card p-4 shadow-sm space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live</p>
            </div>
            {liveDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : liveDacs.map(d => {
              const inhome = d.clients.filter(c => c.programme_stage === 'in_home').length
              return (
                <Link key={d.id} to={`/app/staff/dacs/${d.id}`} className="block rounded-md -mx-2 px-2 py-1 text-sm transition-colors hover:bg-accent">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-muted-foreground">{inhome} client{inhome !== 1 ? 's' : ''} in home</p>
                </Link>
              )
            })}
          </div>

          {/* Matured */}
          <div className="rounded-md border bg-card p-4 shadow-sm space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matured</p>
            </div>
            {maturedDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet</p>
            ) : maturedDacs.map(d => (
              <Link key={d.id} to={`/app/staff/dacs/${d.id}`} className="block rounded-md -mx-2 px-2 py-1 text-sm transition-colors hover:bg-accent">
                <p className="font-medium">{d.name}</p>
                <p className="text-muted-foreground">
                  {d.subscriptions.filter(s => s.status === 'redeemed').length} subscriptions redeemed
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Circle health */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Circle health</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total committed"
            value={metrics ? formatCurrency(metrics.total_committed) : '-'}
            sub="Subscribed + funded"
            to="/app/staff/circle"
            icon={TrendingUp}
            accent="burgundy"
          />
          <StatCard
            label="Total funded"
            value={metrics ? formatCurrency(metrics.total_funded) : '-'}
            sub="Funds received"
            to="/app/staff/circle"
            icon={Landmark}
            accent="burgundy"
          />
          <StatCard
            label="Open DACs"
            value={metrics?.open_dac_count ?? '-'}
            sub="Currently fundraising"
            to="/app/staff/dacs"
            icon={Landmark}
            accent="green"
          />
        </div>
      </section>
    </div>
  )
}
