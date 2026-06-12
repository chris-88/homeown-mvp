// ─── Roles ───────────────────────────────────────────────────
export type StaffRole = 'admin' | 'onboarding' | 'finance' | 'purchasing_agent' | 'client_success' | 'circle_relations'

// 'staff' is a legacy sentinel used only in RouteGuard to mean "any staff role"
export type Role = 'client' | 'circle' | StaffRole

export const STAFF_ROLES = new Set<Role>(['admin','onboarding','finance','purchasing_agent','client_success','circle_relations'])

export function isStaffRole(role: Role | undefined): role is StaffRole {
  return !!role && STAFF_ROLES.has(role)
}

// ─── Stage types ──────────────────────────────────────────────
export type LeadStage =
  | 'new_lead'
  | 'in_discovery'
  | 'pre_qual'
  | 'in_review'
  | 'eligible'
  | 'not_eligible'
  | 'deferred'

export type ProgrammeStage =
  // Phase 2 — Property
  | 'dac_assigned'
  | 'searching'
  | 'sale_agreed'
  | 'conveyancing'
  | 'contracts_signed'
  // Phase 3 — Pathway
  | 'in_home'
  | 'servicing'
  | 'exit_prep'
  | 'option_window'
  | 'pathway_complete'
  | 'exited'

// ─── Doc types ───────────────────────────────────────────────
export type DocType =
  | 'photo_id'
  | 'proof_of_address'
  | 'payslip'
  | 'bank_statement'
  | 'employer_letter'
  | 'tax_document'
  | 'self_employed_accounts'
  | 'accountant_letter'
  | 'maintenance_order'
  | 'other'

export type DocStatus = 'requested' | 'needs_review' | 'approved' | 'rejected'

export type PropertyCaseStatus =
  | 'submitted'
  | 'valuation_scheduled'
  | 'valuation_received'
  | 'approved'
  | 'rejected'
  | 'conveyancing'
  | 'purchased'

export type KycStatus = 'pending' | 'in_progress' | 'complete' | 'failed'

export type DacStatus = 'draft' | 'upcoming' | 'open' | 'closed' | 'matured'

export type SubscriptionStatus =
  | 'soft_commit'
  | 'subscribed'
  | 'funds_requested'
  | 'funded'
  | 'active'
  | 'redeeming'
  | 'redeemed'
  | 'withdrawn'

export type DacDocType = 'info_memo' | 'bond_instrument' | 'subscription_agreement' | 'reporting_pack' | 'other'

export type CircleMemberDocType = 'kyc' | 'signed_subscription' | 'reporting_pack' | 'correspondence' | 'other'

// ─── Interfaces ───────────────────────────────────────────────
export interface Profile {
  id: string
  role: Role
  created_at: string
}

export interface Client {
  id: string
  created_at: string
  updated_at: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  lead_stage: LeadStage
  programme_stage: ProgrammeStage | null
  target_price: number | null
  target_areas: string | null
  household_size: number | null
  dac_id: string | null
  pathway_start_date: string | null
  assigned_to: string | null
  deferred_until: string | null
}

export interface StaffMember {
  id: string
  created_at: string
  updated_at: string
  user_id: string | null
  created_by: string | null
  first_name: string
  last_name: string
  display_name: string | null
  email: string
  phone: string | null
  job_title: string | null
  role: StaffRole
  avatar_path: string | null
  active: boolean
}

export interface DocumentRequest {
  id: string
  created_at: string
  updated_at: string
  client_id: string
  doc_type: DocType
  status: DocStatus
  file_path: string | null
  file_name: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface PropertyCase {
  id: string
  created_at: string
  updated_at: string
  client_id: string
  status: PropertyCaseStatus
  address_line_1: string
  address_line_2: string | null
  city: string
  county: string
  eircode: string | null
  asking_price: number
  agreed_price: number | null
  valuation_amount: number | null
  valuation_file_path: string | null
  notes: string | null
}

export interface Event {
  id: string
  created_at: string
  client_id: string | null
  event_type: string
  actor_id: string | null
  payload: Record<string, unknown> | null
  visibility: 'client' | 'internal'
}

export interface CircleMember {
  id: string
  created_at: string
  updated_at: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string | null
  kyc_status: KycStatus
  source: string | null
  assigned_to: string | null
}

export interface Dac {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  purchasing_agent_id: string | null
  name: string
  cohort_label: string | null
  status: DacStatus
  description: string | null
  geographic_focus: string | null
  property_count: number | null
  target_sub_amount: number | null
  target_senior_amount: number | null
  coupon_rate: number | null
  no_call_months: number
  term_months: number
  open_date: string | null
  close_date: string | null
  notes: string | null
}

export interface Subscription {
  id: string
  created_at: string
  updated_at: string
  circle_member_id: string
  dac_id: string
  amount: number
  coupon_rate_locked: number | null
  initiated_by: 'member' | 'staff'
  staff_actor_id: string | null
  status: SubscriptionStatus
  committed_at: string | null
  funds_requested_at: string | null
  funded_at: string | null
  maturity_date: string | null
  notes: string | null
}

export interface DacDocument {
  id: string
  created_at: string
  dac_id: string
  name: string
  doc_type: DacDocType
  file_path: string
  file_name: string
  uploaded_by: string | null
}

export interface CircleMemberDocument {
  id: string
  created_at: string
  circle_member_id: string
  doc_type: CircleMemberDocType
  name: string
  file_path: string
  file_name: string
  uploaded_by: string | null
}

export interface CircleMemberNote {
  id: string
  created_at: string
  circle_member_id: string
  actor_id: string | null
  text: string
}

// ─── Label maps ───────────────────────────────────────────────
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  onboarding: 'Onboarding',
  finance: 'Finance',
  purchasing_agent: 'Purchasing Agent',
  client_success: 'Client Success',
  circle_relations: 'Circle Relations',
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  photo_id: 'Photo ID',
  proof_of_address: 'Proof of Address',
  payslip: 'Payslip',
  bank_statement: 'Bank Statement',
  employer_letter: 'Employer Letter',
  tax_document: 'Tax Document',
  self_employed_accounts: 'Self-Employed Accounts',
  accountant_letter: 'Accountant Letter',
  maintenance_order: 'Maintenance Order',
  other: 'Other',
}

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  requested: 'Requested',
  needs_review: 'Needs Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'New Lead',
  in_discovery: 'In Discovery',
  pre_qual: 'Pre-Qualification',
  in_review: 'In Review',
  eligible: 'Eligible',
  not_eligible: 'Not Eligible',
  deferred: 'Deferred',
}

export const PROGRAMME_STAGE_LABELS: Record<ProgrammeStage, string> = {
  dac_assigned: 'DAC Assigned',
  searching: 'Searching',
  sale_agreed: 'Sale Agreed',
  conveyancing: 'Conveyancing',
  contracts_signed: 'Contracts Signed',
  in_home: 'In Home',
  servicing: 'Pathway Active',
  exit_prep: 'Exit Preparation',
  option_window: 'Option Window',
  pathway_complete: 'Pathway Complete',
  exited: 'Exited',
}

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  complete: 'Complete',
  failed: 'Failed',
}

export const DAC_STATUS_LABELS: Record<DacStatus, string> = {
  draft: 'Draft',
  upcoming: 'Upcoming',
  open: 'Open',
  closed: 'Closed',
  matured: 'Matured',
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  soft_commit: 'Soft Commit',
  subscribed: 'Subscribed',
  funds_requested: 'Funds Requested',
  funded: 'Funded',
  active: 'Active',
  redeeming: 'Redeeming',
  redeemed: 'Redeemed',
  withdrawn: 'Withdrawn',
}

export const DAC_DOC_TYPE_LABELS: Record<DacDocType, string> = {
  info_memo: 'Information Memorandum',
  bond_instrument: 'Bond Instrument',
  subscription_agreement: 'Subscription Agreement',
  reporting_pack: 'Reporting Pack',
  other: 'Other',
}

export const CIRCLE_MEMBER_DOC_TYPE_LABELS: Record<CircleMemberDocType, string> = {
  kyc: 'KYC',
  signed_subscription: 'Signed Subscription',
  reporting_pack: 'Reporting Pack',
  correspondence: 'Correspondence',
  other: 'Other',
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  staff_note: 'Staff note',
  stage_changed: 'Stage updated',
  results_saved: 'You saved your calculator results',
  limit_letter_issued: 'Your Eligibility Letter is ready',
  sale_agreed_submitted: 'You submitted a property',
  approval_notice_issued: 'Your property has been approved',
  document_approved: 'A document was approved',
  document_rejected: 'A document needs attention',
  pathway_started: 'Your pathway is now active',
  calc_results_presented: 'Calculator results presented',
  call_booked: 'A call was booked',
  pre_qual_submitted: 'Pre-qualification submitted',
  document_uploaded: 'A document was uploaded',
  verification_completed: 'Verification completed',
  valuation_uploaded: 'Valuation uploaded',
  reservation_payment_paid: 'Reservation payment received',
  domiter_received: 'Monthly service fee received',
  exit_initiated: 'Exit initiated',
  completed: 'Programme completed',
}

// ─── Stage progression helpers ───────────────────────────────
export const LEAD_STAGE_ORDER: LeadStage[] = [
  'new_lead', 'in_discovery', 'pre_qual', 'in_review', 'eligible',
]

export const PROGRAMME_STAGE_ORDER: ProgrammeStage[] = [
  'dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed',
  'in_home', 'servicing', 'exit_prep', 'option_window', 'pathway_complete',
]

export function nextLeadStage(current: LeadStage): LeadStage | null {
  const i = LEAD_STAGE_ORDER.indexOf(current)
  return i >= 0 && i < LEAD_STAGE_ORDER.length - 1 ? LEAD_STAGE_ORDER[i + 1] : null
}

export function nextProgrammeStage(current: ProgrammeStage): ProgrammeStage | null {
  const i = PROGRAMME_STAGE_ORDER.indexOf(current)
  return i >= 0 && i < PROGRAMME_STAGE_ORDER.length - 1 ? PROGRAMME_STAGE_ORDER[i + 1] : null
}

// ─── Misc ─────────────────────────────────────────────────────
export const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry',
  'Donegal', 'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare',
  'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo',
  'Tipperary', 'Tyrone', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
]
