import { Link } from 'react-router-dom'
import { LegalLayout, LegalSection, LegalTable } from './LegalLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Notice" lastUpdated="12 June 2026">

      <LegalSection heading="1. Who we are">
        <p>Homeown Limited ("Homeown", "we", "us") is the data controller for personal data collected through this website and through the Homeown programme.</p>
        <p>Homeown Limited is a private limited company incorporated in Ireland (registered with the Companies Registration Office).</p>
        <p><strong className="text-foreground">Contact:</strong> For any questions about this Privacy Notice or about your personal data, contact us at: <a href="mailto:privacy@homeown.ie" className="underline underline-offset-2 hover:text-foreground">privacy@homeown.ie</a></p>
      </LegalSection>

      <LegalSection heading="2. What personal data we collect and why">
        <p>We collect personal data in the following contexts. The legal basis for each is noted.</p>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-foreground">a) Calculator use (anonymous)</p>
          <p>When you use the calculator on this site without saving your results, no personal data is collected. The inputs you enter (property price, location, income) are processed locally in your browser. Nothing is sent to our servers until you choose to save your results.</p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-foreground">b) Saving calculator results</p>
          <p>When you choose to save your results, you provide: first name, last name, and email address. You also give explicit consent to be contacted about the Homeown pathway.</p>
          <ul className="space-y-1 list-disc list-inside text-sm">
            <li><em>Personal data:</em> Name, email address, calculator inputs (property price, location, household type, gross household income, employment type)</li>
            <li><em>Legal basis:</em> Consent (Article 6(1)(a) GDPR)</li>
            <li><em>Purpose:</em> To follow up on your expressed interest in the programme; to book a discovery call</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-foreground">c) Programme participation</p>
          <p>If you proceed beyond the initial interest stage, we collect additional personal data to assess your programme participation eligibility and to administer the programme.</p>
          <ul className="space-y-1 list-disc list-inside text-sm">
            <li><em>Personal data:</em> Identity documents (photo ID, proof of address); income evidence (payslips, employer letters, tax documents, bank statements); other financial documents as required</li>
            <li><em>Legal basis:</em> Contract performance (Article 6(1)(b)), necessary to enter and administer the programme agreement; Legal obligation (Article 6(1)(c)), KYC/AML compliance under Irish law</li>
            <li><em>Purpose:</em> Programme eligibility assessment; identity verification; AML compliance; programme administration</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-foreground">d) Portal use</p>
          <p>When you use the Homeown client portal, we collect data about your activity within the portal (documents uploaded, stage progression, event log). This data is used to administer your programme participation.</p>
          <p className="text-sm"><em>Legal basis:</em> Contract performance (Article 6(1)(b))</p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-foreground">e) Contact and enquiries</p>
          <p>If you contact us by email, we process the data you include in that communication.</p>
          <p className="text-sm"><em>Legal basis:</em> Legitimate interests (Article 6(1)(f)), responding to your enquiry</p>
        </div>
      </LegalSection>

      <LegalSection heading="3. How long we keep your data">
        <LegalTable
          headers={['Data', 'Retention period']}
          rows={[
            ['Saved calculator results (lead data)', '12 months from last contact, unless you proceed to programme participation'],
            ['Programme participation data', 'Duration of programme + 7 years after programme closure'],
            ['Identity and KYC documents', '5 years from the end of the programme, as required by anti-money laundering legislation'],
            ['Email correspondence', '2 years'],
          ]}
        />
      </LegalSection>

      <LegalSection heading="4. Who we share your data with">
        <p>We do not sell your personal data. We share it only with:</p>
        <p className="font-medium text-foreground">Service providers (data processors):</p>
        <ul className="space-y-2 list-disc list-inside text-sm">
          <li><strong className="text-foreground">Supabase:</strong> our database and authentication provider. Data is stored in the EU (Ireland). Supabase processes data under a Data Processing Agreement.</li>
          <li><strong className="text-foreground">Postmark:</strong> our email delivery provider. Postmark is certified under the EU-US Data Privacy Framework. Email addresses are shared only to deliver transactional emails you have requested.</li>
        </ul>
        <p className="font-medium text-foreground">Professional advisors:</p>
        <p>We may share data with our legal counsel or accountants where necessary and subject to confidentiality obligations.</p>
        <p className="font-medium text-foreground">Legal obligations:</p>
        <p>We may disclose data where required by law or by a competent authority.</p>
      </LegalSection>

      <LegalSection heading="5. International transfers">
        <p>Our primary data storage is in the EU (Ireland, via Supabase). Where data is processed outside the EEA (for example, by Postmark for email delivery), we ensure appropriate safeguards are in place, including Standard Contractual Clauses or adequacy decisions.</p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>Under GDPR and the Data Protection Acts 2018, you have the following rights:</p>
        <ul className="space-y-2 list-disc list-inside text-sm">
          <li><strong className="text-foreground">Right of access:</strong> to request a copy of the personal data we hold about you</li>
          <li><strong className="text-foreground">Right to rectification:</strong> to correct inaccurate personal data</li>
          <li><strong className="text-foreground">Right to erasure:</strong> to request deletion of your data in certain circumstances</li>
          <li><strong className="text-foreground">Right to restriction:</strong> to request that we limit how we use your data</li>
          <li><strong className="text-foreground">Right to data portability:</strong> to receive your data in a structured, machine-readable format</li>
          <li><strong className="text-foreground">Right to object:</strong> to object to processing based on legitimate interests or for direct marketing</li>
          <li><strong className="text-foreground">Right to withdraw consent:</strong> where processing is based on consent, you can withdraw it at any time without affecting the lawfulness of prior processing</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:privacy@homeown.ie" className="underline underline-offset-2 hover:text-foreground">privacy@homeown.ie</a>. We will respond within one month.</p>
      </LegalSection>

      <LegalSection heading="7. Right to complain">
        <p>You have the right to lodge a complaint with the Data Protection Commission (DPC), the Irish supervisory authority for data protection:</p>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
          <p>Data Protection Commission</p>
          <p>21 Fitzwilliam Square South</p>
          <p>Dublin 2, D02 RD28</p>
          <p><a href="https://www.dataprotection.ie" className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noopener noreferrer">www.dataprotection.ie</a></p>
          <p><a href="mailto:info@dataprotection.ie" className="underline underline-offset-2 hover:text-foreground">info@dataprotection.ie</a></p>
        </div>
      </LegalSection>

      <LegalSection heading="8. Cookies">
        <p>We use cookies as described in our <Link to="/cookies" className="underline underline-offset-2 hover:text-foreground">Cookie Policy</Link>.</p>
      </LegalSection>

      <LegalSection heading="9. Changes to this notice">
        <p>We may update this Privacy Notice from time to time. The "last updated" date at the top of this page reflects the most recent version. We will notify programme participants of material changes.</p>
      </LegalSection>

    </LegalLayout>
  )
}
