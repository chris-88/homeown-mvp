interface UtmData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

function ensureSessionId(): string {
  const existing = sessionStorage.getItem('homeown_session_id')
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem('homeown_session_id', id)
  return id
}

function sharedProps(): Record<string, unknown> {
  const hook = sessionStorage.getItem('homeown_hook') ?? 'default'
  const utmRaw = sessionStorage.getItem('homeown_utm')
  const utm: UtmData = utmRaw ? JSON.parse(utmRaw) : {}
  return {
    session_id: ensureSessionId(),
    hook,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_content: utm.utm_content ?? null,
  }
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  console.log('[analytics]', event, { ...sharedProps(), ...props })
}

export function buildCalcUrl(): string {
  const params = new URLSearchParams(window.location.search)
  const utmParams = new URLSearchParams()
  ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    if (params.has(key)) utmParams.set(key, params.get(key)!)
  })
  const qs = utmParams.toString()
  return qs ? `/calc?${qs}` : '/calc'
}
