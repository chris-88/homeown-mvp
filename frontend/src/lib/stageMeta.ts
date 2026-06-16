import type { LeadStage, ProgrammeStage } from '@/types'

export interface StageMeta {
  current: string
  toProgress: string
  nextPreview: string
}

export const LEAD_STAGE_META: Record<LeadStage, StageMeta> = {
  new_lead: {
    current: 'This prospect has submitted the calculator. No discovery call has been scheduled yet.',
    toProgress: 'Contact the prospect and schedule a discovery call.',
    nextPreview: 'The prospect moves into active discovery. A confirmation is sent and the call is logged.',
  },
  in_discovery: {
    current: 'A discovery call has been booked or is in progress with this prospect.',
    toProgress: 'Hold the discovery call and confirm the prospect wants to proceed to pre-qualification.',
    nextPreview: 'Documents are requested from the prospect and their application enters pre-qualification.',
  },
  pre_qual: {
    current: 'Document collection is underway. The prospect has been asked to upload their required files.',
    toProgress: 'Receive all required documents from the prospect.',
    nextPreview: 'The full application enters internal review by the team.',
  },
  in_review: {
    current: 'All documents have been received and the application is under internal review.',
    toProgress: 'Complete the internal review and confirm the prospect meets all eligibility criteria.',
    nextPreview: 'The prospect is confirmed as eligible. They can then be matched with a DAC to begin Phase 2.',
  },
  eligible: {
    current: 'This prospect has been confirmed as eligible for the Homeown pathway.',
    toProgress: 'Assign the prospect to an available DAC to move them into Phase 2.',
    nextPreview: 'The prospect enters Phase 2 and begins their property search.',
  },
  not_eligible: {
    current: 'This prospect has been marked as not eligible and is outside the active funnel.',
    toProgress: '',
    nextPreview: '',
  },
  deferred: {
    current: 'This prospect has been deferred and will be revisited at a later date.',
    toProgress: '',
    nextPreview: '',
  },
}

export const PROGRAMME_STAGE_META: Record<ProgrammeStage, StageMeta> = {
  dac_assigned: {
    current: 'This client has been matched with a DAC and is ready to begin their property search.',
    toProgress: 'Confirm the client has started actively viewing and shortlisting properties.',
    nextPreview: 'The client moves into active property search.',
  },
  searching: {
    current: 'The client is actively searching for a property within their target price and areas.',
    toProgress: 'Wait for the client to find a property and have an offer accepted by the seller.',
    nextPreview: 'A sale is agreed on a property and the case moves to conveyancing prep.',
  },
  sale_agreed: {
    current: 'A sale has been agreed on a property. Conveyancing has not yet started.',
    toProgress: 'Engage solicitors and kick off the conveyancing process.',
    nextPreview: 'The property case enters conveyancing.',
  },
  conveyancing: {
    current: 'The property is going through conveyancing — searches, contracts, and legal checks.',
    toProgress: 'Complete conveyancing and have contracts signed by all parties.',
    nextPreview: 'Contracts are signed and the purchase is ready to close.',
  },
  contracts_signed: {
    current: 'Contracts have been signed. The purchase is ready to close.',
    toProgress: 'Close the purchase and confirm the client has moved into the property.',
    nextPreview: 'The client moves in and enters Phase 3 of their pathway.',
  },
  in_home: {
    current: 'The client has moved into their home and is now on their ownership pathway.',
    toProgress: 'Confirm the first service fee payment has been received.',
    nextPreview: 'The pathway becomes active and regular servicing begins.',
  },
  servicing: {
    current: 'The client is living in their home and making regular service fee payments.',
    toProgress: 'Continue servicing until the client approaches their exit or option window.',
    nextPreview: 'The client enters exit preparation ahead of their option window.',
  },
  exit_prep: {
    current: 'The client is approaching their option window and exit terms are being prepared.',
    toProgress: 'Finalise exit terms and valuation ahead of the option window opening.',
    nextPreview: 'The option window opens and the client can choose how to proceed.',
  },
  option_window: {
    current: 'The client’s option window is open. They can buy out, sell, or extend.',
    toProgress: 'Confirm which option the client has chosen.',
    nextPreview: 'The pathway moves to completion or exit based on the client’s choice.',
  },
  pathway_complete: {
    current: 'This client has completed their Homeown pathway.',
    toProgress: '',
    nextPreview: '',
  },
  exited: {
    current: 'This client has exited the Homeown pathway.',
    toProgress: '',
    nextPreview: '',
  },
}
