import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PROGRAMME_STAGE_LABELS } from '@/types'
import type { Client, ProgrammeStage } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users } from 'lucide-react'

const PHASE2_STAGES: ProgrammeStage[] = ['dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed']
const PHASE3_STAGES: ProgrammeStage[] = ['in_home', 'servicing', 'exit_prep', 'option_window', 'pathway_complete', 'exited']

function stageBadgeVariant(stage: ProgrammeStage) {
  if (stage === 'pathway_complete') return 'default' as const
  if (stage === 'exited') return 'outline' as const
  if (PHASE3_STAGES.includes(stage)) return 'default' as const
  return 'secondary' as const
}

type ClientWithDac = Client & { dacs?: { name: string } | null }

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')

  const { data: clients, isLoading } = useQuery<ClientWithDac[]>({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, dacs(name)')
        .not('programme_stage', 'is', null)
        .order('updated_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as ClientWithDac[]
    },
  })

  const filtered = (clients ?? []).filter(c => {
    const matchesSearch = search === '' ||
      `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    const stage = c.programme_stage!
    const matchesPhase =
      phaseFilter === 'all' ||
      (phaseFilter === 'phase2' && PHASE2_STAGES.includes(stage)) ||
      (phaseFilter === 'phase3' && PHASE3_STAGES.includes(stage))
    const matchesStage = stageFilter === 'all' || stage === stageFilter
    return matchesSearch && matchesPhase && matchesStage
  })

  const phase2Count = (clients ?? []).filter(c => PHASE2_STAGES.includes(c.programme_stage!)).length
  const phase3Count = (clients ?? []).filter(c => PHASE3_STAGES.includes(c.programme_stage!)).length

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="mt-1 text-muted-foreground">Phase 2 (property) and Phase 3 (pathway) clients.</p>
      </div>

      {/* Phase summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setPhaseFilter(phaseFilter === 'phase2' ? 'all' : 'phase2')}
          className={`rounded-xl border p-4 text-left transition-colors ${phaseFilter === 'phase2' ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent'}`}
        >
          <p className="text-2xl font-bold">{phase2Count}</p>
          <p className="text-sm text-muted-foreground">Phase 2 — Property search</p>
        </button>
        <button
          onClick={() => setPhaseFilter(phaseFilter === 'phase3' ? 'all' : 'phase3')}
          className={`rounded-xl border p-4 text-left transition-colors ${phaseFilter === 'phase3' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'bg-card hover:bg-accent'}`}
        >
          <p className="text-2xl font-bold">{phase3Count}</p>
          <p className="text-sm text-muted-foreground">Phase 3 — On pathway</p>
        </button>
      </div>

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
            <SelectItem value="" disabled className="text-xs font-semibold text-muted-foreground uppercase">Phase 2</SelectItem>
            {PHASE2_STAGES.map(s => (
              <SelectItem key={s} value={s}>{PROGRAMME_STAGE_LABELS[s]}</SelectItem>
            ))}
            <SelectItem value="" disabled className="text-xs font-semibold text-muted-foreground uppercase">Phase 3</SelectItem>
            {PHASE3_STAGES.map(s => (
              <SelectItem key={s} value={s}>{PROGRAMME_STAGE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="font-medium">No clients found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">DAC</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/app/staff/clients/${c.id}`} className="font-medium hover:underline underline-offset-2">
                      {c.first_name} {c.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={stageBadgeVariant(c.programme_stage!)}>
                      {PROGRAMME_STAGE_LABELS[c.programme_stage!]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.dacs?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
