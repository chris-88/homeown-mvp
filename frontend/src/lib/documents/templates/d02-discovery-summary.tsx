import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocTable, DocFootnote } from '../layout/DocumentLayout'
import type { D02Variables } from '../types'

export const VERSION = '1.0.0'
export const DOCUMENT_TYPE = 'd02-discovery-summary'
export const REQUIRES_ACK = false

const NEXT_STEP_COPY: Record<D02Variables['nextStep'], string> = {
  'book-follow-up': 'We will be in touch to arrange a follow-up call to answer any remaining questions and, if you wish to proceed, to begin the document review stage.',
  'not-fit': 'Based on our discussion, the Homeown pathway does not appear to be the right fit at this time. We wish you well and encourage you to reach out if your circumstances change.',
  'parked': 'We have noted your interest. We will check in with you in a few months. In the meantime, feel free to contact us at support@homeown.ie if anything changes.',
}

export function renderHtml(vars: D02Variables) {
  return (
    <DocumentLayout title="Discovery Call Summary" version={VERSION}>
      <DocH1>Your Homeown summary</DocH1>

      <DocP>Hi {vars.clientName},</DocP>
      <DocP>
        Thank you for speaking with {vars.staffName} on {vars.discoveryDate}. Here is a summary
        of what we discussed and the illustrative figures based on the price range you mentioned.
      </DocP>

      <DocH2>How the Homeown pathway works</DocH2>
      <ul className="list-disc list-outside pl-5 space-y-1 text-sm">
        <li>You move into a property and pay a monthly service fee (Domiter) instead of a mortgage repayment.</li>
        <li>Your purchase option is fixed at 90% of the acquisition price from day one.</li>
        <li>At the end of the pathway term, you can choose to purchase the property at the fixed option price, or exit without obligation.</li>
      </ul>

      <DocH2>Your worked example</DocH2>
      <DocTable rows={[
        ['Target price range', vars.targetPriceBand],
        ['Monthly Domiter (service fee)', vars.domiterExample],
        ['Entry Stake (paid once)', vars.entryStakeExample],
        ['Fixed option price at completion', vars.strikePriceExample],
        ['Pathway term', '60 months'],
      ]} />

      <DocCallout>
        <p className="font-medium">Mandatory disclaimer</p>
        <p>
          These figures are illustrative based on the price range we discussed. They are not a
          commitment, a pre-approval, or an agreement in principle. Actual terms are set out in
          the Pathway Confirmation at signing. Homeown is a structured property pathway service,
          not a lender. Mortgage approval is completed only by an independent regulated lender
          at the end of the term. The purchase option is a right, not an obligation.
        </p>
      </DocCallout>

      <DocH2>Next step</DocH2>
      <DocP>{NEXT_STEP_COPY[vars.nextStep]}</DocP>
      {vars.nextStepNotes && <DocP>{vars.nextStepNotes}</DocP>}

      <DocP>
        Any questions? Email us at{' '}
        <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
      </DocP>

      <DocP>The Homeown team</DocP>

      <DocFootnote>
        These figures are illustrative and based on Homeown's current programme parameters.
        Individual circumstances will vary. This document is not a financial product or an
        offer of credit.
      </DocFootnote>
    </DocumentLayout>
  )
}
