import type { ReactElement } from 'react'
import type { AnyDocumentVariables } from './types'

import * as D01 from './templates/d01-registration'
import * as D02 from './templates/d02-discovery-summary'
import * as D03 from './templates/d03-document-request'
import * as D04 from './templates/d04-prequal-outcome'
import * as D05 from './templates/d05-eligible-confirm'
import * as D08 from './templates/d08-entry-stake-receipt'
import * as Kfs from './templates/kfs'
import * as HpaGuidance from './templates/hpa-guidance'
import * as PrivacyNotice from './templates/privacy-notice'
import * as ComplaintsPolicy from './templates/complaints-policy'

export interface TemplateEntry {
  displayName: string
  version: string
  requiresAck: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHtml: (vars: any) => ReactElement
}

const REGISTRY: Record<string, TemplateEntry> = {
  'd01-registration':     { displayName: 'Registration Confirmation',           version: D01.VERSION,            requiresAck: D01.REQUIRES_ACK,            renderHtml: D01.renderHtml },
  'd02-discovery-summary':{ displayName: 'Discovery Call Summary',              version: D02.VERSION,            requiresAck: D02.REQUIRES_ACK,            renderHtml: D02.renderHtml },
  'd03-document-request': { displayName: 'Document Request',                    version: D03.VERSION,            requiresAck: D03.REQUIRES_ACK,            renderHtml: D03.renderHtml },
  'd04-prequal-outcome':  { displayName: 'Pre-Qualification Outcome Letter',    version: D04.VERSION,            requiresAck: D04.REQUIRES_ACK,            renderHtml: D04.renderHtml },
  'd05-eligible-confirm': { displayName: 'Eligible to Proceed Confirmation',    version: D05.VERSION,            requiresAck: D05.REQUIRES_ACK,            renderHtml: D05.renderHtml },
  'd08-entry-stake-receipt':{ displayName: 'Entry Stake Receipt',               version: D08.VERSION,            requiresAck: D08.REQUIRES_ACK,            renderHtml: D08.renderHtml },
  'kfs':                  { displayName: 'Key Facts Sheet',                     version: Kfs.VERSION,            requiresAck: Kfs.REQUIRES_ACK,            renderHtml: Kfs.renderHtml },
  'hpa-guidance':         { displayName: 'HPA Guidance (Plain English)',         version: HpaGuidance.VERSION,    requiresAck: HpaGuidance.REQUIRES_ACK,    renderHtml: HpaGuidance.renderHtml },
  'privacy-notice':       { displayName: 'Privacy Notice',                      version: PrivacyNotice.VERSION,  requiresAck: PrivacyNotice.REQUIRES_ACK,  renderHtml: PrivacyNotice.renderHtml },
  'complaints-policy':    { displayName: 'Complaints Handling Policy',           version: ComplaintsPolicy.VERSION, requiresAck: ComplaintsPolicy.REQUIRES_ACK, renderHtml: ComplaintsPolicy.renderHtml },
}

export function getTemplate(documentType: string): TemplateEntry | null {
  return REGISTRY[documentType] ?? null
}

export function getAllTemplateTypes(): string[] {
  return Object.keys(REGISTRY)
}

export function getDisplayName(documentType: string): string {
  return REGISTRY[documentType]?.displayName ?? documentType
}

// Phase A document types available for manual staff dispatch
export const PHASE_A_MANUAL_TYPES = [
  'd02-discovery-summary',
  'd04-prequal-outcome',
  'd05-eligible-confirm',
  'd08-entry-stake-receipt',
  'kfs',
  'hpa-guidance',
  'privacy-notice',
  'complaints-policy',
] as const

export { AnyDocumentVariables }
