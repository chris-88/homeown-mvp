import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocList, DocFootnote } from '../layout/DocumentLayout'
import type { PrivacyNoticeVariables } from '../types'

export const VERSION = '0.1.0'
export const DOCUMENT_TYPE = 'privacy-notice'
export const REQUIRES_ACK = true

export function renderHtml(vars: PrivacyNoticeVariables) {
  return (
    <DocumentLayout title="Privacy Notice" version={vars.version}>
      <DocH1>Privacy Notice</DocH1>

      <DocP>
        <strong>Issued to:</strong> {vars.clientName} &nbsp;|&nbsp;
        <strong>Date:</strong> {vars.issuedDate} &nbsp;|&nbsp;
        <strong>Version:</strong> {vars.version}
      </DocP>

      <DocCallout>
        <p>
          This notice explains how Homeown Limited collects, uses, and stores your personal
          data in connection with the Homeown pathway. Please read it carefully.
        </p>
      </DocCallout>

      <DocH2>Who we are</DocH2>
      <DocP>
        Homeown Limited is the data controller for the personal data collected in connection
        with the Homeown pathway. You can contact us at support@homeown.ie or
        complaints@homeown.ie.
      </DocP>

      <DocH2>What data we collect</DocH2>
      <DocList items={[
        'Identity data: name, date of birth, photo ID.',
        'Contact data: email address, phone number, residential address.',
        'Financial data: income documents, bank statements, payslips, tax documents.',
        'Property data: details of properties under consideration or occupied under the pathway.',
        'Programme data: Domiter payment history, compliance status, correspondence.',
        'Technical data: login records, document access timestamps.',
      ]} />

      <DocH2>Why we collect it</DocH2>
      <DocP>
        We process your data to: assess programme participation eligibility, administer your
        pathway, fulfil our legal and contractual obligations, manage compliance with the
        programme rules, and communicate with you about your programme status.
      </DocP>

      <DocH2>Legal bases</DocH2>
      <DocList items={[
        'Contract performance: processing necessary to administer your pathway.',
        'Legal obligation: AML/KYC checks and record-keeping requirements.',
        'Legitimate interests: fraud prevention and programme compliance.',
      ]} />

      <DocH2>Who we share data with</DocH2>
      <DocList items={[
        'Our legal advisors and solicitors in connection with property transactions.',
        'Insurers, where relevant to programme requirements.',
        'Regulatory authorities, where required by law.',
        'Third-party technology providers (data processing only, not sale of data).',
      ]} />
      <DocP>We do not sell your data.</DocP>

      <DocH2>How long we keep it</DocH2>
      <DocP>
        We retain your programme records for 7 years after the end of your pathway (whether
        by completion, voluntary exit, or termination), to comply with our legal obligations.
        Identity verification documents are retained for 5 years after the end of the pathway.
      </DocP>

      <DocH2>Your rights</DocH2>
      <DocList items={[
        'Access: request a copy of the data we hold about you.',
        'Rectification: request correction of inaccurate data.',
        'Erasure: request deletion (subject to legal retention requirements).',
        'Restriction: request that we limit processing in certain circumstances.',
        'Portability: receive your data in a structured, machine-readable format.',
        'Objection: object to processing based on legitimate interests.',
      ]} />
      <DocP>
        To exercise any of these rights, email{' '}
        <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
      </DocP>

      <DocH2>Complaints</DocH2>
      <DocP>
        If you believe we have mishandled your data, you have the right to lodge a complaint
        with the Data Protection Commission at{' '}
        <a href="https://www.dataprotection.ie" className="text-[#1E4A35] underline">www.dataprotection.ie</a>.
      </DocP>

      <DocFootnote>
        Homeown Limited, Ireland. This notice is provided in accordance with the General Data
        Protection Regulation (GDPR) and the Data Protection Acts 1988 to 2018.
      </DocFootnote>
    </DocumentLayout>
  )
}
