import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DOC_TYPE_LABELS, LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────
interface ClientStat { id: string; lead_stage: string; programme_stage: string | null }
interface PathwayClient {
  id: string; first_name: string; last_name: string
  programme_stage: string | null; pathway_start_date: string | null
  dacs: { name: string } | null
  property_cases: Array<{ asking_price: number; agreed_price: number | null; status: string }>
}
interface DocQueueItem { id: string; doc_type: string; created_at: string; clients: { id: string; first_name: string; last_name: string } }
interface StageQueueItem { id: string; first_name: string; last_name: string; programme_stage: string; updated_at: string }
interface CircleSubStat { amount: number; status: string }
interface OpenDacStat { target_sub_amount: number | null; subscriptions: Array<{ amount: number; status: string }> }

// ── Stage helpers ──────────────────────────────────────────────
const STAGE_ORDER = [
  'onboarding_docs_requested', 'onboarding_under_review', 'limit_letter_ready',
  'searching', 'sale_agreed', 'valuation_in_progress', 'approval_notice_issued',
  'committed', 'in_home', 'servicing_active', 'exit_prep', 'completed', 'exited',
]
const ONBOARDING_STAGES = new Set(['onboarding_docs_requested', 'onboarding_under_review', 'limit_letter_ready'])
const ACTIVE_STAGES = new Set(['searching', 'sale_agreed', 'valuation_in_progress', 'approval_notice_issued', 'committed', 'in_home', 'servicing_active', 'exit_prep'])
const COMPLETED_STAGES = new Set(['completed', 'exited'])

const MILESTONES = [
  { label: 'Verified',     stage: 'limit_letter_ready' },
  { label: 'Sale Agreed',  stage: 'sale_agreed' },
  { label: 'Approved',     stage: 'approval_notice_issued' },
  { label: 'In Home',      stage: 'in_home' },
  { label: 'Active',       stage: 'servicing_active' },
]

function hasPassed(current: string | null, target: string) {
  if (!current) return false
  return STAGE_ORDER.indexOf(current) >= STAGE_ORDER.indexOf(target)
}

function endDate(start: string | null) {
  if (!start) return null
  const d = new Date(start)
  d.setMonth(d.getMonth() + 60)
  return d.toLocaleDateString('en-IE', { year: 'numeric', month: 'short' })
}

function propertyValue(pc: PathwayClient['property_cases']) {
  if (!pc?.length) return null
  const active = pc.find(c => c.status !== 'rejected') ?? pc[0]
  return active.agreed_price ?? active.asking_price
}

// ── Sub-components ─────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function BreakdownRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm truncate">{label}</span>
          <span className="text-sm font-medium ml-2 shrink-0">{count}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function StaffDashboard() {
  const { data: clientStats } = useQuery({
    queryKey: ['staff-client-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id, lead_stage, programme_stage')
      return (data ?? []) as ClientStat[]
    },
  })

  const { data: pathwayClients } = useQuery({
    queryKey: ['staff-pathway-clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name, programme_stage, pathway_start_date, dacs(name), property_cases(asking_price, agreed_price, status)')
        .in('programme_stage', ['committed', 'in_home', 'servicing_active', 'exit_prep', 'completed'])
        .order('pathway_start_date', { ascending: true, nullsFirst: false })
      return (data ?? []) as PathwayClient[]
    },
  })

  const { data: docQueue } = useQuery({
    queryKey: ['staff-doc-queue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_requests')
        .select('id, doc_type, created_at, clients(id, first_name, last_name)')
        .eq('status', 'received')
        .order('created_at')
      return (data ?? []) as DocQueueItem[]
    },
  })

  const { data: stageQueue } = useQuery({
    queryKey: ['staff-stage-queue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name, programme_stage, updated_at')
        .in('programme_stage', ['onboarding_under_review', 'sale_agreed', 'valuation_in_progress'])
        .order('updated_at')
      return (data ?? []) as StageQueueItem[]
    },
  })

  const { data: circleMemberCount } = useQuery({
    queryKey: ['circle-member-count'],
    queryFn: async () => {
      const { count } = await supabase.from('circle_members').select('id', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: circleSubStats } = useQuery({
    queryKey: ['circle-sub-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('amount, status')
      return (data ?? []) as CircleSubStat[]
    },
  })

  const { data: openDacs } = useQuery({
    queryKey: ['open-dacs-gap'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs')
        .select('target_sub_amount, subscriptions(amount, status)')
        .eq('status', 'open')
      return (data ?? []) as OpenDacStat[]
    },
  })

  const stats = useMemo(() => {
    const all = clientStats ?? []
    return {
      leads: all.filter(c => !c.programme_stage).length,
      onboarding: all.filter(c => ONBOARDING_STAGES.has(c.programme_stage ?? '')).length,
      active: all.filter(c => ACTIVE_STAGES.has(c.programme_stage ?? '')).length,
      completed: all.filter(c => COMPLETED_STAGES.has(c.programme_stage ?? '')).length,
      total: all.length,
    }
  }, [clientStats])

  const circleStats = useMemo(() => {
    const subs = circleSubStats ?? []
    const softCommit = subs.filter(s => s.status === 'soft_commit').reduce((n, s) => n + s.amount, 0)
    const funded = subs.filter(s => ['funded', 'active'].includes(s.status)).reduce((n, s) => n + s.amount, 0)
    const allCommitted = subs
      .filter(s => !['soft_commit', 'withdrawn'].includes(s.status))
      .reduce((n, s) => n + s.amount, 0)
    const gap = (openDacs ?? []).reduce((total, d) => {
      const raised = (d.subscriptions ?? [])
        .filter(s => !['soft_commit', 'withdrawn'].includes(s.status))
        .reduce((n, s) => n + s.amount, 0)
      return total + Math.max(0, (d.target_sub_amount ?? 0) - raised)
    }, 0)
    return { softCommit, funded, allCommitted, gap }
  }, [circleSubStats, openDacs])

  const leadBreakdown = useMemo(() => {
    const all = clientStats ?? []
    const order = Object.keys(LEAD_STAGE_LABELS)
    const counts: Record<string, number> = {}
    all.forEach(c => { counts[c.lead_stage] = (counts[c.lead_stage] ?? 0) + 1 })
    return order.filter(k => counts[k]).map(k => ({ stage: k, count: counts[k] }))
  }, [clientStats])

  const progBreakdown = useMemo(() => {
    const all = clientStats ?? []
    const order = STAGE_ORDER
    const counts: Record<string, number> = {}
    all.filter(c => c.programme_stage).forEach(c => { counts[c.programme_stage!] = (counts[c.programme_stage!] ?? 0) + 1 })
    return order.filter(k => counts[k]).map(k => ({ stage: k, count: counts[k] }))
  }, [clientStats])

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Staff dashboard</h1>
        <p className="mt-1 text-muted-foreground">Pipeline overview and items awaiting action.</p>
      </div>

      {/* Client summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads" value={stats.leads} sub="No programme stage yet" />
        <StatCard label="In Onboarding" value={stats.onboarding} sub="Docs through verification" />
        <StatCard label="On Pathway" value={stats.active} sub="Searching through exit prep" />
        <StatCard label="Completed" value={stats.completed} sub={`${stats.total} total clients`} />
      </div>

      {/* Stage breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Lead pipeline</CardTitle></CardHeader>
          <CardContent>
            {leadBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : leadBreakdown.map(({ stage, count }) => (
              <BreakdownRow
                key={stage}
                label={LEAD_STAGE_LABELS[stage as keyof typeof LEAD_STAGE_LABELS] ?? stage}
                count={count}
                total={stats.total}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Programme stages</CardTitle></CardHeader>
          <CardContent>
            {progBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients in programme yet.</p>
            ) : progBreakdown.map(({ stage, count }) => (
              <BreakdownRow
                key={stage}
                label={PROGRAMME_STAGE_LABELS[stage as keyof typeof PROGRAMME_STAGE_LABELS] ?? stage}
                count={count}
                total={stats.total}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Circle summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Circle overview</CardTitle>
            <Link to="/app/staff/circle" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              View Circle CRM
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">{circleMemberCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(circleStats.allCommitted)}</p>
              <p className="text-sm text-muted-foreground">Total committed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(circleStats.funded)}</p>
              <p className="text-sm text-muted-foreground">Funded</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(circleStats.gap)}</p>
              <p className="text-sm text-muted-foreground">Open DAC gap</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active pathway clients */}
      {(pathwayClients?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Active pathway clients</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Client</th>
                  <th className="pb-3 pr-4 font-medium">Stage</th>
                  <th className="pb-3 pr-4 font-medium">DAC</th>
                  <th className="pb-3 pr-4 font-medium">Property value</th>
                  <th className="pb-3 pr-4 font-medium">Start</th>
                  <th className="pb-3 pr-4 font-medium">End (60 mo)</th>
                  <th className="pb-3 font-medium">Milestones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pathwayClients?.map((c) => {
                  const val = propertyValue(c.property_cases)
                  return (
                    <tr key={c.id}>
                      <td className="py-3 pr-4">
                        <Link to={`/app/staff/clients/${c.id}`} className="font-medium hover:underline">
                          {c.first_name} {c.last_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className="text-xs">
                          {PROGRAMME_STAGE_LABELS[c.programme_stage as keyof typeof PROGRAMME_STAGE_LABELS] ?? c.programme_stage}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{(c.dacs as any)?.name ?? '-'}</td>
                      <td className="py-3 pr-4">{val ? formatCurrency(val) : '-'}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.pathway_start_date ? formatDate(c.pathway_start_date) : '-'}</td>
                      <td className="py-3 pr-4 font-medium">{endDate(c.pathway_start_date) ?? '-'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          {MILESTONES.map((m) => {
                            const done = hasPassed(c.programme_stage, m.stage)
                            return (
                              <span
                                key={m.stage}
                                title={m.label}
                                className={`h-2 w-2 rounded-full ${done ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                              />
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Milestone dots (left to right): Verified &middot; Sale Agreed &middot; Approved &middot; In Home &middot; Active
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action queues */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Documents to review</CardTitle>
              <Badge variant="secondary">{docQueue?.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!docQueue?.length ? (
              <p className="text-sm text-muted-foreground">Queue is empty.</p>
            ) : (
              <ul className="divide-y">
                {docQueue.map((item) => (
                  <li key={item.id} className="py-3">
                    <Link to={`/app/staff/clients/${item.clients?.id}`} className="flex items-center justify-between hover:text-primary">
                      <div>
                        <p className="text-sm font-medium">{item.clients?.first_name} {item.clients?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[item.doc_type as keyof typeof DOC_TYPE_LABELS] ?? item.doc_type}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Stages to action</CardTitle>
              <Badge variant="secondary">{stageQueue?.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!stageQueue?.length ? (
              <p className="text-sm text-muted-foreground">No stages awaiting action.</p>
            ) : (
              <ul className="divide-y">
                {stageQueue.map((item) => (
                  <li key={item.id} className="py-3">
                    <Link to={`/app/staff/clients/${item.id}`} className="flex items-center justify-between hover:text-primary">
                      <div>
                        <p className="text-sm font-medium">{item.first_name} {item.last_name}</p>
                        <p className="text-xs text-muted-foreground">{PROGRAMME_STAGE_LABELS[item.programme_stage as keyof typeof PROGRAMME_STAGE_LABELS] ?? item.programme_stage}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(item.updated_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
