import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  DAC_STATUS_LABELS,
} from '@/types'
import type { Dac, Subscription } from '@/types'
import { formatCurrency } from '@/lib/utils'

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

const PHASE1_COLOR = 'border-border bg-muted/40'
const PHASE2_COLOR = 'border-primary/30 bg-primary/5'
const PHASE3_COLOR = 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'

function StageBox({ stage, count, color }: { stage: string; count: number; color: string }) {
  return (
    <div className={`flex-1 min-w-0 rounded-lg border p-3 text-center ${color}`}>
      <p className={`text-2xl font-bold tabular-nums ${count === 0 ? 'text-muted-foreground/30' : ''}`}>
        {count === 0 ? '-' : count}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
        {LEAD_STAGE_LABELS[stage as keyof typeof LEAD_STAGE_LABELS] ??
         PROGRAMME_STAGE_LABELS[stage as keyof typeof PROGRAMME_STAGE_LABELS] ??
         stage}
      </p>
    </div>
  )
}

function PhaseGroup({ label, stages, counts, color }: {
  label: string
  stages: string[]
  counts: Record<string, number>
  color: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex gap-1.5">
        {stages.map(s => (
          <StageBox key={s} stage={s} count={counts[s] ?? 0} color={color} />
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
          />
          <StatCard
            label="Pathway complete"
            value={metrics?.pathway_complete_count ?? '-'}
            sub="Completed the programme"
          />
          <StatCard
            label="Active prospects"
            value={metrics?.total_prospects ?? '-'}
            sub={metrics ? `${metrics.eligible_unassigned} eligible, awaiting DAC` : undefined}
          />
          <StatCard
            label="Circle members"
            value={metrics?.circle_member_count ?? '-'}
            sub={metrics ? `${metrics.circle_kyc_complete} KYC complete` : undefined}
          />
        </div>
      </section>

      {/* Pipeline funnel */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline funnel</h2>
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <PhaseGroup
            label="Phase 1: Discovery"
            stages={LEAD_STAGE_ORDER}
            counts={stageCounts}
            color={PHASE1_COLOR}
          />
          <PhaseGroup
            label="Phase 2: Property"
            stages={['dac_assigned','searching','sale_agreed','conveyancing','contracts_signed']}
            counts={stageCounts}
            color={PHASE2_COLOR}
          />
          <PhaseGroup
            label="Phase 3: Pathway"
            stages={['in_home','servicing','exit_prep','option_window','pathway_complete']}
            counts={stageCounts}
            color={PHASE3_COLOR}
          />
          <div className="flex gap-4 border-t pt-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stageCounts['not_eligible'] ?? 0}</span> not eligible
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stageCounts['deferred'] ?? 0}</span> deferred
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stageCounts['exited'] ?? 0}</span> exited
            </div>
          </div>
        </div>
      </section>

      {/* DAC Lifecycle */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">DAC lifecycle</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Planning */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Planning</p>
            {planningDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : planningDacs.map(d => (
              <div key={d.id} className="text-sm">
                <p className="font-medium">{d.name}</p>
                <p className="text-muted-foreground">{DAC_STATUS_LABELS[d.status]}</p>
              </div>
            ))}
          </div>

          {/* Fundraising */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fundraising</p>
            {fundraisingDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None open</p>
            ) : fundraisingDacs.map(d => {
              const raised = computeRaisedAmount(d.subscriptions)
              const target = d.target_sub_amount ?? 0
              const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0
              return (
                <div key={d.id} className="space-y-1.5">
                  <p className="text-sm font-medium">{d.name}</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(raised)} / {target ? formatCurrency(target) : '-'} ({pct}%)
                  </p>
                </div>
              )
            })}
          </div>

          {/* Live */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live</p>
            {liveDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : liveDacs.map(d => {
              const inhome = d.clients.filter(c => c.programme_stage === 'in_home').length
              return (
                <div key={d.id} className="text-sm">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-muted-foreground">{inhome} client{inhome !== 1 ? 's' : ''} in home</p>
                </div>
              )
            })}
          </div>

          {/* Matured */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matured</p>
            {maturedDacs.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet</p>
            ) : maturedDacs.map(d => (
              <div key={d.id} className="text-sm">
                <p className="font-medium">{d.name}</p>
                <p className="text-muted-foreground">
                  {d.subscriptions.filter(s => s.status === 'redeemed').length} subscriptions redeemed
                </p>
              </div>
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
          />
          <StatCard
            label="Total funded"
            value={metrics ? formatCurrency(metrics.total_funded) : '-'}
            sub="Funds received"
          />
          <StatCard
            label="Open DACs"
            value={metrics?.open_dac_count ?? '-'}
            sub="Currently fundraising"
          />
        </div>
      </section>
    </div>
  )
}
