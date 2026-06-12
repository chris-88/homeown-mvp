export type Role = 'client' | 'staff' | 'admin' | 'circle'

export type LeadStage =
  | 'registered'
  | 'call_booked'
  | 'call_complete'
  | 'pre_qual_requested'
  | 'pre_qual_submitted'
  | 'pre_qual_review'
  | 'eligible'
  | 'not_eligible'
  | 'deferred'
  | 'mover_interest'

export type ProgrammeStage =
  | 'onboarding_docs_requested'
  | 'onboarding_under_review'
  | 'limit_letter_ready'
  | 'searching'
  | 'sale_agreed'
  | 'valuation_in_progress'
  | 'approval_notice_issued'
  | 'committed'
  | 'in_home'
  | 'servicing_active'
  | 'exit_prep'
  | 'completed'
  | 'exited'

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

export type DocStatus = 'requested' | 'received' | 'approved' | 'rejected'

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

export type DacDocType =
  | 'info_memo'
  | 'bond_instrument'
  | 'subscription_agreement'
  | 'reporting_pack'
  | 'other'

export type CircleMemberDocType =
  | 'kyc'
  | 'signed_subscription'
  | 'reporting_pack'
  | 'correspondence'
  | 'other'

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
}

export interface Dac {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
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

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  registered: 'Registered',
  call_booked: 'Call Booked',
  call_complete: 'Call Complete',
  pre_qual_requested: 'Pre-Qual Requested',
  pre_qual_submitted: 'Pre-Qual Submitted',
  pre_qual_review: 'Pre-Qual Review',
  eligible: 'Eligible',
  not_eligible: 'Not Eligible',
  deferred: 'Deferred',
  mover_interest: 'Mover Interest',
}

export const PROGRAMME_STAGE_LABELS: Record<ProgrammeStage, string> = {
  onboarding_docs_requested: 'Documents Requested',
  onboarding_under_review: 'Under Review',
  limit_letter_ready: 'Eligible',
  searching: 'Searching',
  sale_agreed: 'Sale Agreed',
  valuation_in_progress: 'Valuation In Progress',
  approval_notice_issued: 'Approval Confirmed',
  committed: 'Committed',
  in_home: 'In Home',
  servicing_active: 'Pathway Active',
  exit_prep: 'Exit Preparation',
  completed: 'Completed',
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

export const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry',
  'Donegal', 'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare',
  'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo',
  'Tipperary', 'Tyrone', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
]
