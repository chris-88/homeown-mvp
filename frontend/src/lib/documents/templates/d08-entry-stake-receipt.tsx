import { DocumentLayout, DocH1, DocH2, DocP, DocCallout, DocTable, DocFootnote } from '../layout/DocumentLayout'
import type { D08Variables } from '../types'

export const VERSION = '1.0.0'
export const DOCUMENT_TYPE = 'd08-entry-stake-receipt'
export const REQUIRES_ACK = false

export function renderHtml(vars: D08Variables) {
  return (
    <DocumentLayout title="Entry Stake Receipt" version={VERSION}>
      <DocH1>Entry Stake receipt</DocH1>

      <DocP>
        This document confirms receipt of the Entry Stake payment from {vars.clientName}
        in connection with the property at:
      </DocP>

      <DocH2>{vars.propertyAddress}</DocH2>

      <DocTable rows={[
        ['Client name', vars.clientName],
        ['Amount received', vars.amount],
        ['Payment date', vars.paymentDate],
        ['Payment reference', vars.paymentReference],
        ['Receiving entity', vars.dacName],
      ]} />

      <DocCallout>
        <p className="font-medium">Important</p>
        <p>
          The Entry Stake funds stamp duty on the property acquisition. It represents a
          restricted beneficial participation in the DAC and is equity at risk, not a
          refundable payment. Please refer to Section 4 of your Home-ownership Pathway
          Agreement for full terms.
        </p>
      </DocCallout>

      <DocP>Issued by: {vars.staffName}, Homeown</DocP>

      <DocFootnote>
        This receipt is issued for the sole purpose of confirming the Entry Stake payment.
        It is not a tax receipt, a mortgage document, or evidence of ownership.
        Retain this document as part of your programme records.
      </DocFootnote>
    </DocumentLayout>
  )
}
