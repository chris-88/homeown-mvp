import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from '@/types'
import type { Client, LeadStage } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus } from 'lucide-react'

function stageBadgeVariant(stage: LeadStage): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (stage === 'eligible') return 'default'
  if (stage === 'not_eligible') return 'destructive'
  if (stage === 'deferred') return 'outline'
  return 'secondary'
}

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

export default function ProspectsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')

  const { data: prospects, isLoading } = useQuery<Client[]>({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('dac_id', null)
        .order('updated_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Client[]
    },
  })

  const filtered = (prospects ?? []).filter(c => {
    const matchesSearch = search === '' ||
      `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesStage = stageFilter === 'all' || c.lead_stage === stageFilter
    return matchesSearch && matchesStage
  })

  const counts: Record<string, number> = {}
  for (const c of prospects ?? []) {
    counts[c.lead_stage] = (counts[c.lead_stage] ?? 0) + 1
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prospects</h1>
          <p className="mt-1 text-muted-foreground">Phase 1 pipeline — discovery through eligibility.</p>
        </div>
      </div>

      {/* Stage summary chips */}
      <div className="flex flex-wrap gap-2">
        {LEAD_STAGE_ORDER.map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(stageFilter === s ? 'all' : s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              stageFilter === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-accent'
            }`}
          >
            {LEAD_STAGE_LABELS[s]} <span className="ml-1 opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
        <button
          onClick={() => setStageFilter(stageFilter === 'not_eligible' ? 'all' : 'not_eligible')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            stageFilter === 'not_eligible'
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-border bg-card hover:bg-accent'
          }`}
        >
          Not Eligible <span className="ml-1 opacity-70">{counts['not_eligible'] ?? 0}</span>
        </button>
        <button
          onClick={() => setStageFilter(stageFilter === 'deferred' ? 'all' : 'deferred')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            stageFilter === 'deferred'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:bg-accent'
          }`}
        >
          Deferred <span className="ml-1 opacity-70">{counts['deferred'] ?? 0}</span>
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {LEAD_STAGE_ORDER.map(s => (
              <SelectItem key={s} value={s}>{LEAD_STAGE_LABELS[s]}</SelectItem>
            ))}
            <SelectItem value="not_eligible">Not Eligible</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          <UserPlus className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="font-medium">No prospects found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Target areas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => {
                const days = daysAgo(c.updated_at)
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/app/staff/prospects/${c.id}`} className="font-medium hover:underline underline-offset-2">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={stageBadgeVariant(c.lead_stage)}>
                        {LEAD_STAGE_LABELS[c.lead_stage]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={days >= 3 ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                        {days}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.target_areas ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
