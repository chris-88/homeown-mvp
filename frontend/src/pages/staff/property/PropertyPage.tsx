import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PROGRAMME_STAGE_LABELS } from '@/types'
import type { Client, ProgrammeStage } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StageFilterChips } from '@/components/shared/StageFilterChips'

const PHASE2_STAGES: ProgrammeStage[] = ['dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed']

type ClientWithDac = Client & { dacs?: { name: string } | null }

export default function PropertyPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')

  const { data: clients, isLoading } = useQuery<ClientWithDac[]>({
    queryKey: ['property-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, dacs(name)')
        .in('programme_stage', PHASE2_STAGES)
        .order('updated_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as ClientWithDac[]
    },
  })

  const filtered = (clients ?? []).filter(c => {
    const matchesSearch = search === '' ||
      `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    const stage = c.programme_stage!
    const matchesStage = stageFilter === 'all' || stage === stageFilter
    return matchesSearch && matchesStage
  })

  const counts: Record<string, number> = {}
  for (const c of clients ?? []) {
    counts[c.programme_stage!] = (counts[c.programme_stage!] ?? 0) + 1
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Property</h1>
        <p className="mt-1 text-muted-foreground">Clients in active property search and purchase.</p>
      </div>

      {/* Stage summary chips */}
      <StageFilterChips
        stages={PHASE2_STAGES}
        labels={PROGRAMME_STAGE_LABELS}
        counts={counts}
        active={stageFilter}
        onToggle={s => setStageFilter(stageFilter === s ? 'all' : s)}
      />

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {PHASE2_STAGES.map(s => (
              <SelectItem key={s} value={s}>{PROGRAMME_STAGE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No clients found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Stage</th>
                  <th className="pb-3 pr-4 font-medium">DAC</th>
                  <th className="pb-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4">
                      <Link to={`/app/staff/property/${c.id}`} className="font-medium hover:underline underline-offset-2">
                        {c.first_name} {c.last_name}
                      </Link>
                      {!c.active && <span className="ml-2 text-xs text-muted-foreground">(disabled)</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary">
                        {PROGRAMME_STAGE_LABELS[c.programme_stage!]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{c.dacs?.name ?? '-'}</td>
                    <td className="py-3 text-muted-foreground">{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
