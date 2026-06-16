import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocWarning, DocList, DocFootnote } from '../layout/DocumentLayout'
import type { D04Variables } from '../types'

export const VERSION = '1.0.0'
export const DOCUMENT_TYPE = 'd04-prequal-outcome'
export const REQUIRES_ACK = true

const OUTCOME_TITLE: Record<D04Variables['outcome'], string> = {
  eligible: 'You meet the programme participation criteria',
  not_eligible: 'You do not currently meet the programme participation criteria',
  deferred: 'Further information is required before we can complete our assessment',
}

export function renderHtml(vars: D04Variables) {
  return (
    <DocumentLayout title="Pre-Qualification Outcome Letter" version={VERSION}>
      <DocH1>Programme participation review</DocH1>

      <DocP>
        <strong>Reference:</strong> {vars.clientName} &nbsp;|&nbsp; <strong>Date:</strong> {vars.decisionDate}
      </DocP>

      <DocH2>{OUTCOME_TITLE[vars.outcome]}</DocH2>

      {vars.outcome === 'eligible' && (
        <>
          <DocP>
            We have completed our programme participation review for {vars.clientName}. Based on
            the information and documents provided, you meet the programme participation criteria
            for the Homeown pathway.
          </DocP>
          <DocP>
            This confirms that you are eligible to proceed to the property search and
            pre-signing stages.
          </DocP>
          <DocCallout>
            <p className="font-medium">What this is not</p>
            <p>
              This is not a mortgage approval, a pre-approval, an approval in principle, or any
              indication of mortgage eligibility. Mortgage approval is completed only by an
              independent regulated lender at the end of the pathway term.
            </p>
          </DocCallout>
        </>
      )}

      {vars.outcome === 'not_eligible' && (
        <>
          <DocP>
            We have completed our programme participation review for {vars.clientName}. Based on
            the information and documents provided, you do not currently meet the programme
            participation criteria for the Homeown pathway.
          </DocP>
          {vars.reasons && vars.reasons.length > 0 && (
            <>
              <DocH2>Reason(s)</DocH2>
              <DocList items={vars.reasons} />
            </>
          )}
          <DocP>
            This outcome may change if your circumstances change. You are welcome to re-apply
            in future. If you have questions about this decision, contact us at{' '}
            <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
          </DocP>
        </>
      )}

      {vars.outcome === 'deferred' && (
        <>
          <DocP>
            We have reviewed the information and documents provided. We need some additional
            information before we can complete our assessment.
          </DocP>
          {vars.reasons && vars.reasons.length > 0 && (
            <>
              <DocH2>Outstanding items</DocH2>
              <DocList items={vars.reasons} />
            </>
          )}
          {vars.deadlineDate && (
            <DocWarning>
              <p>Please provide the above by {vars.deadlineDate}.</p>
            </DocWarning>
          )}
          <DocP>
            If you have questions, contact{' '}
            <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
          </DocP>
        </>
      )}

      {vars.nextSteps.length > 0 && (
        <>
          <DocH2>Next steps</DocH2>
          <DocList items={vars.nextSteps} />
        </>
      )}

      <DocP>Issued by: {vars.staffName}, Homeown</DocP>

      <DocFootnote>
        This letter relates solely to programme participation criteria. It does not constitute
        a credit assessment, an affordability assessment, or any form of financial advice.
      </DocFootnote>
    </DocumentLayout>
  )
}
