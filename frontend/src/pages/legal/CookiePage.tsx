import { LegalLayout, LegalSection, LegalTable } from './LegalLayout'

export default function CookiePage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="12 June 2026">

      <LegalSection heading="What are cookies?">
        <p>Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work, to remember your preferences, and in some cases to collect analytics data about how visitors use a site.</p>
      </LegalSection>

      <LegalSection heading="What cookies does Homeown use?">
        <p>Homeown currently uses one category of cookies: <strong className="text-foreground">strictly necessary cookies</strong>.</p>
        <LegalTable
          headers={['Cookie', 'Purpose', 'Duration']}
          rows={[
            ['sb-[ref]-auth-token', 'Keeps you logged in to the Homeown portal', 'Session (cleared when you close your browser, or after token expiry)'],
            ['sb-[ref]-auth-token-code-verifier', 'Security token used during login', 'Session'],
          ]}
        />
        <p>These cookies are set only when you log in to the Homeown portal. They are not set on the public-facing pages of this site.</p>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">We do not use:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Analytics cookies (no Google Analytics or equivalent)</li>
            <li>Advertising or tracking cookies</li>
            <li>Social media cookies</li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection heading="Strictly necessary cookies">
        <p>Strictly necessary cookies are essential for the portal to function. They keep you authenticated when you are logged in. They cannot be disabled without preventing portal access. Under Irish ePrivacy regulations, strictly necessary cookies do not require your consent, but we are required to tell you about them.</p>
      </LegalSection>

      <LegalSection heading="How to control cookies">
        <p>You can control and delete cookies through your browser settings. Deleting the Homeown session cookie will log you out of the portal. For guidance on managing cookies in your browser, visit <a href="https://www.aboutcookies.org" className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a>.</p>
      </LegalSection>

      <LegalSection heading="Future changes">
        <p>If we introduce analytics or other non-essential cookies in future, we will update this policy and implement a consent mechanism before those cookies are set.</p>
      </LegalSection>

    </LegalLayout>
  )
}
