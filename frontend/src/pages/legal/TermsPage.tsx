import { LegalLayout, LegalSection } from './LegalLayout'

export default function TermsPage() {
  return (
    <LegalLayout title="Website Terms of Use" lastUpdated="12 June 2026">

      <LegalSection heading="1. About this website">
        <p>This website is operated by Homeown Limited, a private limited company incorporated in Ireland. By using this website, you agree to these terms.</p>
      </LegalSection>

      <LegalSection heading="2. Information only — not financial advice">
        <p>Nothing on this website constitutes financial advice, investment advice, legal advice, or any other regulated advice. The information on this site is provided for general information purposes only. You should seek independent professional advice before making any financial decision.</p>
        <p>In particular, Homeown does not assess mortgage affordability or creditworthiness. The calculator on this site provides illustrative figures only. It is not an approval, a pre-approval, an agreement in principle, or any indication of mortgage eligibility. Mortgage approval is provided only by independent regulated lenders at the end of the programme term and is not guaranteed.</p>
      </LegalSection>

      <LegalSection heading="3. The programme agreement">
        <p>Your participation in the Homeown programme, if you proceed, is governed by the Homeown Pathway Agreement and associated documentation — not by these website terms. These website terms apply only to your use of this website.</p>
      </LegalSection>

      <LegalSection heading="4. Accuracy of information">
        <p>We make reasonable efforts to ensure the information on this website is accurate and up to date. However, we do not guarantee its accuracy or completeness. The Homeown model, pricing, and programme terms may change. The authoritative terms of the programme are set out in the documentation provided to you at the time of programme entry.</p>
      </LegalSection>

      <LegalSection heading="5. No liability for reliance">
        <p>To the fullest extent permitted by Irish law, Homeown accepts no liability for any loss or damage arising from your reliance on information contained on this website. This does not affect any statutory rights you may have as a consumer.</p>
      </LegalSection>

      <LegalSection heading="6. Intellectual property">
        <p>All content on this website — including text, design, graphics, and software — is owned by or licensed to Homeown Limited. You may not reproduce, distribute, or use any content from this website for commercial purposes without our written permission.</p>
      </LegalSection>

      <LegalSection heading="7. Third-party links">
        <p>This website may contain links to third-party websites. We are not responsible for the content or privacy practices of those sites.</p>
      </LegalSection>

      <LegalSection heading="8. Governing law">
        <p>These terms are governed by Irish law. Any disputes arising from your use of this website are subject to the exclusive jurisdiction of the Irish courts.</p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>For any questions about these terms, contact us at <a href="mailto:hello@homeown.ie" className="underline underline-offset-2 hover:text-foreground">hello@homeown.ie</a>.</p>
      </LegalSection>

    </LegalLayout>
  )
}
