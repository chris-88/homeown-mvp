import { LegalLayout, LegalSection, LegalTable } from './LegalLayout'

export default function ComplaintsPage() {
  return (
    <LegalLayout
      title="Complaints"
      lastUpdated="12 June 2026"
      subheading="How to raise a concern or make a formal complaint."
    >

      <LegalSection heading="Our commitment">
        <p>Homeown is committed to handling all concerns and complaints fairly, promptly, and transparently. If something has gone wrong, we want to know about it and to put it right.</p>
      </LegalSection>

      <LegalSection heading="How to make a complaint">
        <p>You can make a complaint by email to: <a href="mailto:complaints@homeown.ie" className="font-medium text-foreground underline underline-offset-2 hover:opacity-80">complaints@homeown.ie</a></p>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">Please include:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Your full name and contact details</li>
            <li>A description of your complaint and the outcome you are seeking</li>
            <li>Any relevant dates, reference numbers, or supporting information</li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection heading="What happens next">
        <LegalTable
          headers={['Step', 'Timeline']}
          rows={[
            ['Acknowledgement', 'We will acknowledge your complaint within 5 business days of receipt'],
            ['Investigation', 'We will investigate your complaint thoroughly and fairly'],
            ['Response', 'We will provide a full written response within 20 business days of acknowledgement. If we need more time, we will let you know and explain why.'],
            ['Final response', 'If you remain dissatisfied after our response, we will issue a final response letter confirming our position.'],
          ]}
        />
      </LegalSection>

      <LegalSection heading="If you remain dissatisfied">
        <p>If you are not satisfied with our final response, you may have the right to refer your complaint to an independent body. The appropriate body will depend on the nature of your complaint and the regulatory status of the product or service involved. We will advise you of any applicable escalation route in our final response letter.</p>
        <p>For data protection related complaints, you may contact the Data Protection Commission at <a href="https://www.dataprotection.ie" className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noopener noreferrer">www.dataprotection.ie</a>.</p>
      </LegalSection>

      <LegalSection heading="Vulnerable customers">
        <p>If you need assistance making a complaint — for example, due to a disability, language barrier, or other circumstance — please let us know and we will do everything we can to accommodate you.</p>
      </LegalSection>

    </LegalLayout>
  )
}
