import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocFootnote } from '../layout/DocumentLayout'
import type { D05Variables } from '../types'

export const VERSION = '1.0.0'
export const DOCUMENT_TYPE = 'd05-eligible-confirm'
export const REQUIRES_ACK = true

export function renderHtml(vars: D05Variables) {
  return (
    <DocumentLayout title="Eligible to Proceed Confirmation" version={VERSION}>
      <DocH1>Eligible to proceed</DocH1>

      <DocP>Hi {vars.clientName},</DocP>

      <DocP>
        Following our review, you are eligible to proceed to the next stage of the Homeown
        pathway. This letter confirms your eligibility as of {vars.decisionDate}.
      </DocP>

      <DocCallout>
        <p className="font-medium">What this means</p>
        <p>
          Eligibility means you meet the programme participation criteria. It is not a mortgage
          approval, a pre-approval, or an approval in principle. Mortgage approval is completed
          only by an independent regulated lender at the end of the pathway term.
        </p>
      </DocCallout>

      <DocH2>Your Key Facts Sheet</DocH2>
      <DocP>
        The Key Facts Sheet (KFS) sets out the key terms of the Homeown pathway in plain language.
        Please read it carefully before our next call.{' '}
        {vars.kfsUrl && (
          <>
            You can access it at{' '}
            <a href={vars.kfsUrl} className="text-[#1E4A35] underline">{vars.kfsUrl}</a>.
          </>
        )}
      </DocP>

      <DocH2>Next steps</DocH2>
      <DocP>
        {vars.nextCallDate
          ? `We will speak on ${vars.nextCallDate} to walk through the Key Facts Sheet and answer any questions.`
          : 'We will be in touch shortly to arrange a call to walk through the Key Facts Sheet.'}
      </DocP>
      <DocP>
        If you have questions in the meantime, email{' '}
        <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
      </DocP>

      <DocP>Issued by: {vars.staffName}, Homeown</DocP>

      <DocFootnote>
        This letter relates solely to programme participation criteria. It does not constitute
        a credit assessment, a mortgage pre-approval, or any form of financial advice.
      </DocFootnote>
    </DocumentLayout>
  )
}
