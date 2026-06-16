import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocFootnote } from '../layout/DocumentLayout'
import type { D03Variables } from '../types'

export const VERSION = '1.0.0'
export const DOCUMENT_TYPE = 'd03-document-request'
export const REQUIRES_ACK = false

const PAYE_ITEMS = [
  'Valid photo ID (passport or driving licence)',
  'Proof of current address (utility bill or bank statement, dated within the last 3 months)',
  '6 months’ payslips',
  'Most recent P60 or Employment Detail Summary',
  '6 months’ bank statements (showing salary lodgements)',
  'Evidence of current housing cost (e.g. rental agreement or bank statement showing payments)',
]

const SELF_EMPLOYED_EXTRA = [
  '2 years’ audited accounts or accountant letter',
  '2 years’ Form 11 or tax returns',
  'Evidence of company registration (if applicable)',
]

const ENTRY_STAKE_ITEM =
  'Entry Stake source of funds evidence (3 months’ statements from the account used)'

export function renderHtml(vars: D03Variables) {
  const items = [
    ...PAYE_ITEMS,
    ...(vars.employmentType === 'self_employed' ? SELF_EMPLOYED_EXTRA : []),
    ...(vars.entryContributionRequired ? [ENTRY_STAKE_ITEM] : []),
  ]

  return (
    <DocumentLayout title="Document Request" version={VERSION}>
      <DocH1>Documents we need from you</DocH1>

      <DocP>Hi {vars.clientName},</DocP>
      <DocP>
        To progress your application, we need the following documents from you.
        {vars.deadlineDate && ` Please upload them by ${vars.deadlineDate}.`}
      </DocP>

      <DocH2>Required documents</DocH2>
      <ul className="list-disc list-outside pl-5 space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <DocCallout>
        <p>
          You can upload your documents in the{' '}
          <a href={vars.portalUploadUrl} className="text-[#1E4A35] underline">Homeown portal</a>.
          Each document type has a dedicated upload slot.
        </p>
      </DocCallout>

      <DocP>
        If you have any questions about what is accepted, email{' '}
        <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
      </DocP>

      <DocP>The Homeown team</DocP>

      <DocFootnote>
        These documents are used only to confirm programme eligibility and that monthly payments
        are operationally feasible. Homeown does not assess mortgage affordability or
        creditworthiness. Mortgage assessment is completed only by an independent regulated
        lender at exit.
      </DocFootnote>
    </DocumentLayout>
  )
}
