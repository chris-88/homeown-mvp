import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocWarning, DocTable, DocFootnote } from '../layout/DocumentLayout'
import type { KfsVariables } from '../types'

export const VERSION = '0.2.2'
export const DOCUMENT_TYPE = 'kfs'
export const REQUIRES_ACK = true

export function renderHtml(vars: KfsVariables) {
  return (
    <DocumentLayout title="Key Facts Sheet" version={vars.version}>
      <DocH1>Key Facts Sheet</DocH1>

      <DocP>
        <strong>Issued to:</strong> {vars.clientName} &nbsp;|&nbsp;
        <strong>Date:</strong> {vars.issuedDate} &nbsp;|&nbsp;
        <strong>Version:</strong> {vars.version}
      </DocP>

      <DocCallout>
        <p className="font-medium">Please read this document carefully.</p>
        <p>
          This Key Facts Sheet summarises the main terms of the Homeown pathway in plain language.
          It does not replace the Home-ownership Pathway Agreement (HPA), which is the binding
          legal document. You should read both documents before signing.
        </p>
      </DocCallout>

      <DocH2>What is Homeown?</DocH2>
      <DocP>
        Homeown offers a structured pathway to property ownership. You move into a property
        under a lease arrangement and pay a monthly service fee (Domiter) while building
        towards a fixed purchase option at the end of the term.
      </DocP>

      <DocH2>Key terms at a glance</DocH2>
      <DocTable rows={[
        ['Pathway term', '60 months (5 years)'],
        ['Monthly service fee (Domiter)', 'Calculated as 8.2% of acquisition price / 12'],
        ['Entry Stake', '1% of acquisition price, paid once before move-in'],
        ['Fixed option price', '90% of acquisition price, agreed at signing'],
        ['Option exercise window', 'Opens at month 55, closes at month 60'],
        ['Purchase option type', 'Right (not obligation) to purchase at fixed price'],
      ]} />

      <DocH2>What is the Domiter?</DocH2>
      <DocP>
        The Domiter is a monthly service fee. It is not a mortgage repayment, and it does not
        accumulate as equity or any form of credit. It covers your occupancy of the property
        and your participation in the Homeown programme. It is collected by SEPA Direct Debit
        on an agreed collection date each month.
      </DocP>

      <DocH2>What is the Entry Stake?</DocH2>
      <DocP>
        The Entry Stake is a one-time payment equal to 1% of the acquisition price. It funds
        stamp duty on the property acquisition and represents restricted beneficial participation
        in the DAC. It is equity at risk: it is not refundable if you exit or are terminated
        from the programme. See Section 4 of the HPA for full terms.
      </DocP>

      <DocH2>What is the purchase option?</DocH2>
      <DocP>
        At any point in months 55 to 60, you may choose to exercise a purchase option to buy
        the property at the fixed option price agreed at signing (90% of the original
        acquisition price). Exercising the option requires mortgage approval from a
        regulated lender. You are under no obligation to exercise the option.
      </DocP>

      <DocH2>What happens at the end of the term?</DocH2>
      <DocP>
        If you exercise your option: your solicitor completes the conveyancing and title
        transfers to you at the fixed option price.
      </DocP>
      <DocP>
        If you do not exercise your option: you exit the programme. The option expires.
        No further Domiter is due. Class C Units are cancelled per the Trust Deed.
        You have no further financial obligation to Homeown.
      </DocP>

      <DocH2>Programme rules (summary)</DocH2>
      <DocP>
        You must: pay the Domiter on time each month, maintain buildings insurance (and income
        protection for the full term), keep the property in good condition, and notify Homeown
        of any material change in circumstances.
      </DocP>
      <DocP>
        A missed Domiter payment opens a cure window (typically 14 days). If not cured, a
        strike is recorded. Three strikes result in programme termination. Full rules are in
        HPA Schedule 2.
      </DocP>

      <DocH2>What Homeown is not</DocH2>
      <DocWarning>
        <p>
          Homeown is not a lender and does not provide mortgage credit. The Domiter is not
          rent, a mortgage repayment, or a savings product. Homeown does not guarantee that
          you will obtain mortgage approval at the end of the term. Programme participation
          is not an approval in principle or an indication of mortgage eligibility.
        </p>
      </DocWarning>

      <DocH2>Regulatory status</DocH2>
      <DocP>
        Homeown Limited is not regulated by the Central Bank of Ireland as a mortgage lender
        or credit intermediary. The Homeown pathway is a structured lease and option
        arrangement. You should seek independent legal and financial advice before signing.
      </DocP>

      <DocH2>Complaints</DocH2>
      <DocP>
        If you have a complaint, email complaints@homeown.ie. Our complaints handling
        procedure is set out in the Complaints Handling Policy, a copy of which is provided
        with your signing pack.
      </DocP>

      <DocFootnote>
        This Key Facts Sheet is provided for information. It does not constitute financial
        advice. The binding terms of the Homeown pathway are set out in the signed
        Home-ownership Pathway Agreement and its schedules.
      </DocFootnote>
    </DocumentLayout>
  )
}
