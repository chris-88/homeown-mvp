import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocList, DocTable, DocFootnote } from '../layout/DocumentLayout'
import type { ComplaintsPolicyVariables } from '../types'

export const VERSION = '0.1.0'
export const DOCUMENT_TYPE = 'complaints-policy'
export const REQUIRES_ACK = true

export function renderHtml(vars: ComplaintsPolicyVariables) {
  return (
    <DocumentLayout title="Complaints Handling Policy" version={vars.version}>
      <DocH1>Complaints Handling Policy</DocH1>

      <DocP>
        <strong>Issued to:</strong> {vars.clientName} &nbsp;|&nbsp;
        <strong>Date:</strong> {vars.issuedDate} &nbsp;|&nbsp;
        <strong>Version:</strong> {vars.version}
      </DocP>

      <DocCallout>
        <p>
          Homeown is committed to handling all complaints fairly, promptly, and transparently.
          This policy sets out how to make a complaint and what to expect from us.
        </p>
      </DocCallout>

      <DocH2>How to make a complaint</DocH2>
      <DocP>
        You can submit a complaint by:
      </DocP>
      <DocList items={[
        'Email: complaints@homeown.ie',
        'Post: Homeown Limited, Dublin, Ireland',
        'Via your Homeown portal (Support section)',
      ]} />
      <DocP>
        Please include: your name, contact details, a description of the issue, and (if
        relevant) any reference numbers or document IDs.
      </DocP>

      <DocH2>What happens next</DocH2>
      <DocTable rows={[
        ['Acknowledgement', 'Within 2 business days of receiving your complaint'],
        ['Initial response', 'Within 5 business days (or we will update you on timelines)'],
        ['Final response', 'Within 20 business days of receiving your complaint'],
      ]} />

      <DocH2>Our investigation process</DocH2>
      <DocList items={[
        'We will assign your complaint to a senior team member not involved in the matter.',
        'We may contact you for additional information.',
        'We will review all relevant records and communications.',
        'We will provide a written final response explaining our findings and any action taken.',
      ]} />

      <DocH2>If you are not satisfied</DocH2>
      <DocP>
        If you are not satisfied with our final response, you have the right to refer your
        complaint to the relevant regulatory body. As Homeown is not a regulated financial
        services provider, complaints about data handling may be referred to the Data
        Protection Commission at{' '}
        <a href="https://www.dataprotection.ie" className="text-[#1E4A35] underline">www.dataprotection.ie</a>.
      </DocP>

      <DocH2>What we cannot do</DocH2>
      <DocP>
        We cannot accept complaints about: matters that are the subject of legal proceedings;
        complaints made more than 3 years after the event complained of; matters outside our
        control (such as mortgage lender decisions).
      </DocP>

      <DocFootnote>
        This policy applies to all Homeown pathway participants. Homeown Limited, Ireland.
      </DocFootnote>
    </DocumentLayout>
  )
}
