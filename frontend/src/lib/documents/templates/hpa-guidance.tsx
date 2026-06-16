import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocFootnote } from '../layout/DocumentLayout'
import type { HpaGuidanceVariables } from '../types'

export const VERSION = '0.2.1'
export const DOCUMENT_TYPE = 'hpa-guidance'
export const REQUIRES_ACK = false

export function renderHtml(vars: HpaGuidanceVariables) {
  return (
    <DocumentLayout title="HPA Guidance (Plain English)" version={VERSION}>
      <DocH1>Understanding your Home-ownership Pathway Agreement</DocH1>

      <DocP>
        <strong>Issued to:</strong> {vars.clientName} &nbsp;|&nbsp;
        <strong>Date:</strong> {vars.issuedDate}
      </DocP>

      <DocCallout>
        <p>
          This guide explains the Home-ownership Pathway Agreement (HPA) in plain language.
          It is a companion to the HPA, not a replacement for it. The HPA is the binding
          legal document. If there is any difference between this guide and the HPA,
          the HPA prevails.
        </p>
      </DocCallout>

      <DocH2>The basics</DocH2>
      <DocP>
        The HPA is a contract between you and Homeown. It sets out the full terms of your
        participation in the pathway: what you pay, what Homeown provides, your rights and
        obligations, and what happens at the end.
      </DocP>

      <DocH2>Schedule 1: Pathway Confirmation</DocH2>
      <DocP>
        This schedule contains the numbers that apply specifically to you: the property
        address, acquisition price, monthly Domiter, Entry Stake, fixed option price, and
        the option exercise window. These are your personal terms and are fixed at signing.
      </DocP>

      <DocH2>Schedule 2: Programme Rules</DocH2>
      <DocP>
        This schedule sets out what is required of you during the pathway. Key rules:
      </DocP>
      <ul className="list-disc list-outside pl-5 space-y-1 text-sm">
        <li>Pay the Domiter on the agreed date each month via SEPA Direct Debit.</li>
        <li>Maintain buildings insurance covering the full reinstatement value of the property.</li>
        <li>Maintain income protection insurance for the full pathway term.</li>
        <li>Keep the property in good condition and report any damage promptly.</li>
        <li>Notify Homeown within 14 days of any material change in your financial circumstances.</li>
        <li>Do not sublet, assign, or otherwise deal with your interest without prior written approval.</li>
      </ul>

      <DocH2>What happens if you miss a payment?</DocH2>
      <DocP>
        A missed Domiter payment is a programme breach. A cure window opens (typically 14 days).
        If you pay within the cure window, no strike is recorded. If you do not pay within the
        cure window, a strike is recorded. Three strikes result in programme termination and
        you must vacate the property. See Schedule 2, Section D for the full process.
      </DocP>

      <DocH2>The purchase option</DocH2>
      <DocP>
        During months 55 to 60 of the pathway, you can choose to exercise a purchase option
        to buy the property at the fixed option price agreed at signing. To do this:
      </DocP>
      <ul className="list-disc list-outside pl-5 space-y-1 text-sm">
        <li>Give Homeown written notice of your intent to exercise (via the portal).</li>
        <li>Obtain mortgage approval from a regulated lender for the option price.</li>
        <li>Your solicitor completes conveyancing. Legal title transfers on completion.</li>
      </ul>

      <DocH2>If you choose not to exercise</DocH2>
      <DocP>
        You are not obliged to purchase. If you choose not to exercise, the option expires
        at the end of month 60. You give 30 days' exit notice, vacate the property, and
        your Class C Units are cancelled. You have no further financial obligation to Homeown
        beyond any Domiter due up to your exit date.
      </DocP>

      <DocH2>The Class C Units</DocH2>
      <DocP>
        When you join the programme, Class C Units are issued in your name in the DAC that
        holds the property. These units represent a restricted beneficial participation.
        They are non-transferable, non-assignable, and non-pledgeable. They do not give
        you any voting rights or income rights. They are cancelled on exit or on exercise
        of the purchase option.
      </DocP>

      <DocH2>Getting advice</DocH2>
      <DocP>
        We recommend that you seek independent legal and financial advice before signing.
        If you have questions about the HPA, email{' '}
        <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">support@homeown.ie</a>.
      </DocP>

      <DocFootnote>
        This guide is for information only. The binding terms of the Homeown pathway are
        set out in the signed Home-ownership Pathway Agreement and its schedules.
        This guide does not create legal obligations.
      </DocFootnote>
    </DocumentLayout>
  )
}
