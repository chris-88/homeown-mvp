import { DocumentLayout, DocH1, DocP, DocCallout } from '../layout/DocumentLayout'
import type { D01Variables } from '../types'

export const VERSION = '1.0.0'
export const DOCUMENT_TYPE = 'd01-registration'
export const REQUIRES_ACK = false

export function renderHtml(vars: D01Variables) {
  return (
    <DocumentLayout title="Registration Confirmation" version={VERSION}>
      <DocH1>You've registered with Homeown</DocH1>

      <DocP>Hi {vars.first_name},</DocP>

      <DocP>
        Thanks for registering with Homeown.
      </DocP>

      <DocP>
        We've saved your contact details. Our team will be in touch to book a discovery call,
        a short, no-pressure conversation to explain how the pathway works and check if it could
        be right for you.
      </DocP>

      <DocCallout>
        <p>
          In the meantime, you can find out more about how Homeown works at{' '}
          <a href={`${vars.site_url}/how-it-works`} className="text-[#1E4A35] underline">
            {vars.site_url}/how-it-works
          </a>.
        </p>
        <p className="mt-1">
          The Key Facts Sheet, which explains what you would be agreeing to if you were to join
          the programme, is available at{' '}
          <a href={`${vars.site_url}/#/kfs`} className="text-[#1E4A35] underline">
            {vars.site_url}/#/kfs
          </a>.
        </p>
      </DocCallout>

      <DocP>
        If you have any questions, email{' '}
        <a href="mailto:support@homeown.ie" className="text-[#1E4A35] underline">
          support@homeown.ie
        </a>.
      </DocP>

      <DocP>The Homeown team</DocP>
    </DocumentLayout>
  )
}
