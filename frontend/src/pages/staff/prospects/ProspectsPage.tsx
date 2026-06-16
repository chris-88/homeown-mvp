import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from '@/types'
import type { Client, LeadStage } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StageFilterChips } from '@/components/shared/StageFilterChips'

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
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>(searchParams.get('stage') ?? 'all')

  const { data: prospects, isLoading } = useQuery<Client[]>({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('programme_stage', null)
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
          <p className="mt-1 text-muted-foreground">Phase 1 pipeline: discovery through eligibility.</p>
        </div>
      </div>

      {/* Stage summary chips */}
      <StageFilterChips
        stages={LEAD_STAGE_ORDER}
        labels={LEAD_STAGE_LABELS}
        counts={counts}
        active={stageFilter}
        onToggle={s => setStageFilter(stageFilter === s ? 'all' : s)}
        extra={[
          { value: 'not_eligible', label: 'Not Eligible', variant: 'destructive' },
          { value: 'deferred', label: 'Deferred', variant: 'default' },
        ]}
      />

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
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No prospects found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Stage</th>
                  <th className="pb-3 pr-4 font-medium">Days</th>
                  <th className="pb-3 font-medium">Target areas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(c => {
                  const days = daysAgo(c.updated_at)
                  return (
                    <tr key={c.id}>
                      <td className="py-3 pr-4">
                        <Link to={`/app/staff/prospects/${c.id}`} className="font-medium hover:underline underline-offset-2">
                          {c.first_name} {c.last_name}
                        </Link>
                        {!c.active && <span className="ml-2 text-xs text-muted-foreground">(disabled)</span>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={stageBadgeVariant(c.lead_stage)}>
                          {LEAD_STAGE_LABELS[c.lead_stage]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={days >= 3 ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                          {days}d
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{c.target_areas ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
