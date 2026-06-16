// Shared TypeScript interfaces for all document template variables.
// Each template's Variables interface is defined here and re-exported.

export interface D01Variables {
  first_name: string
  site_url: string
}

export interface D02Variables {
  clientName: string
  discoveryDate: string
  staffName: string
  targetPriceBand: string
  domiterExample: string
  entryStakeExample: string
  strikePriceExample: string
  nextStep: 'book-follow-up' | 'not-fit' | 'parked'
  nextStepNotes?: string
}

export interface D03Variables {
  clientName: string
  employmentType: 'paye' | 'self_employed'
  entryContributionRequired: boolean
  deadlineDate?: string
  portalUploadUrl: string
}

export interface D04Variables {
  clientName: string
  outcome: 'eligible' | 'not_eligible' | 'deferred'
  decisionDate: string
  reasons?: string[]
  nextSteps: string[]
  staffName: string
  deadlineDate?: string
}

export interface D05Variables {
  clientName: string
  decisionDate: string
  staffName: string
  kfsUrl: string
  nextCallDate?: string
}

export interface D06Variables {
  clientName: string
  propertyAddress: string
  outcome: 'go' | 'no_go'
  outcomeDate: string
  reasons?: string[]
  nextSteps: string[]
}

export interface D07Variables {
  clientName: string
  propertyAddress: string
  acquisitionPrice: string
  pathwayTerm: string
  domiterAmount: string
  entryStake: string
  strikePrice: string
  optionWindowOpen: string
  optionWindowClose: string
  collectionDate: string
}

export interface D08Variables {
  clientName: string
  propertyAddress: string
  amount: string
  paymentDate: string
  paymentReference: string
  dacName: string
  staffName: string
}

export interface D09Variables {
  clientName: string
  propertyAddress: string
  pathwayStartDate: string
  firstCollectionDate: string
  domiterAmount: string
  collectionDay: string
  strikePrice: string
  optionWindowOpen: string
  optionWindowClose: string
  staffName: string
}

export interface D10Variables {
  clientName: string
  propertyAddress: string
  beneficialInterestPercent: string
  acquisitionPrice: string
  dacName: string
  issueDate: string
}

export interface D11Variables {
  clientName: string
  propertyAddress: string
  statementMonth: string
  statementNumber: string
  status: 'good_standing' | 'breach_open' | 'breach_cured' | 'on_strike'
  domiterAmount: string
  collectionDate: string
  strikeCount: number
  nextCollectionDate: string
  optionWindowOpen: string
}

export interface D12Variables {
  clientName: string
  propertyAddress: string
  breachType: string
  breachEventDate: string
  breachSummary: string
  evidenceReferences: string[]
  cureWindowDays: number
  cureDeadline: string
  requiredActions: string[]
  noticeDate: string
  referenceId: string
}

export interface D13Variables {
  clientName: string
  propertyAddress: string
  referenceBreach: string
  breachType: string
  cureConfirmedDate: string
  evidenceReferences: string[]
  noticeDate: string
}

export interface D14Variables {
  clientName: string
  propertyAddress: string
  breachType: string
  breachEventDate: string
  breachSummary: string
  evidenceReferences: string[]
  strikeCountAfterThis: 1 | 2 | 3
  watchWindowStart: string
  watchWindowEnd: string
  immediateTerminationIfRepeat: boolean
  noticeDate: string
  referenceId: string
}

export interface D15Variables {
  clientName: string
  propertyAddress: string
  terminationTrigger: string
  evidenceReferences: string[]
  effectiveTerminationDate: string
  handoverDeadline: string
  noticeDate: string
}

export interface D16Variables {
  changeNoticeId: string
  clientName: string
  effectiveDate: string
  documentsUpdated: { name: string; version: string; date: string }[]
  summary: string[]
  whatChanged: string
  whyChanged: string
  whoImpacted: string
  whatClientNeeds: string
}

export interface D17Variables {
  clientName: string
  propertyAddress: string
  checkInDate: string
  staffName: string
  currentStatus: string
  currentMonth: string
  topicsDiscussed: string[]
  actionItems: { description: string; owner: string; dueDate: string }[]
  nextCheckInDate: string
}

export interface D18Variables {
  clientName: string
  propertyAddress: string
  optionWindowOpen: string
  optionWindowClose: string
  strikePrice: string
  currentMonth: string
  currentStatus: string
}

export interface D19Variables {
  clientName: string
  propertyAddress: string
  optionWindowOpen: string
  optionWindowClose: string
  strikePrice: string
  completionAmountDue: string
}

export interface D20Variables {
  clientName: string
  propertyAddress: string
  intent: 'exercise' | 'exit' | 'undecided'
  submittedAt: string
  optionWindowOpen: string
}

export interface D21Variables {
  clientName: string
  propertyAddress: string
  completionDate: string
  solicitorContact: string
  requiredFromClient: string[]
  staffName: string
}

export interface D22Variables {
  clientName: string
  propertyAddress: string
  completionDate: string
  pathwayStartDate: string
  staffName: string
}

export interface D23Variables {
  clientName: string
  propertyAddress: string
  exitType: 'voluntary' | 'termination'
  effectiveExitDate: string
  domiterDueTo: string
  classCCancelledDate: string
  optionExtinguishedDate: string
  staffName: string
}

export interface KfsVariables {
  clientName: string
  issuedDate: string
  version: string
}

export interface HpaGuidanceVariables {
  clientName: string
  issuedDate: string
}

export interface PrivacyNoticeVariables {
  clientName: string
  issuedDate: string
  version: string
}

export interface ComplaintsPolicyVariables {
  clientName: string
  issuedDate: string
  version: string
}

export type AnyDocumentVariables =
  | D01Variables | D02Variables | D03Variables | D04Variables | D05Variables
  | D06Variables | D07Variables | D08Variables | D09Variables | D10Variables
  | D11Variables | D12Variables | D13Variables | D14Variables | D15Variables
  | D16Variables | D17Variables | D18Variables | D19Variables | D20Variables
  | D21Variables | D22Variables | D23Variables
  | KfsVariables | HpaGuidanceVariables | PrivacyNoticeVariables | ComplaintsPolicyVariables
