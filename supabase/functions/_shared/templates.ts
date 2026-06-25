const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://homeown.ie'
export const FROM_ADDRESS = 'Homeown <noreply@homeown.ie>'

type Model = Record<string, unknown>

function s(v: unknown): string { return String(v ?? '') }

function wrap(subject: string, body: string): { subject: string; html: string; text: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:24px;background:#f5f0ea;font-family:'Montserrat',Georgia,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <p style="margin:0 0 12px;text-align:right;font-size:12px;color:#9ca3af;font-family:'Montserrat',Georgia,sans-serif">
      <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline">View on homeown.ie</a>
    </p>
    <div style="background:#ffffff;border-radius:8px;overflow:hidden">
    <div style="background:#2c4a3e;padding:24px 32px">
      <span style="font-family:'Montserrat',Georgia,sans-serif;font-size:20px;font-weight:700;color:#e7d4bb;letter-spacing:-0.3px">Homeown</span>
    </div>
    <div style="padding:32px;color:#1a1a1a;font-size:15px;line-height:1.7;font-family:'Montserrat',Georgia,sans-serif">
      ${body}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 20px">
      <p style="margin:0;font-size:12px;color:#9ca3af;font-family:'Montserrat',Georgia,sans-serif">
        Homeown &middot; Dublin, Ireland &nbsp;|&nbsp;
        <a href="${SITE_URL}/#/privacy" style="color:#9ca3af">Privacy policy</a>
      </p>
    </div>
    </div>
  </div>
</body>
</html>`
  const text = body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return { subject, html, text }
}

function btn(label: string, url: string): string {
  return `<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2c4a3e;color:#f5f0ea;text-decoration:none;border-radius:6px;font-size:14px;font-family:'Montserrat',Georgia,sans-serif;font-weight:600">${label}</a></p>`
}

function sig(): string {
  return `<p>Warm regards,<br>The Homeown Team</p>`
}

const TEMPLATES: Record<string, (m: Model) => { subject: string; body: string }> = {

  // ── Client journey ──────────────────────────────────────────────────────────

  'lead-saved-confirm': (m) => ({
    subject: 'Book your discovery call',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Thank you for completing our calculator. Based on your details, Homeown could be a great fit for your journey to property ownership.</p>
<p>The next step is a short discovery call with one of our team. It's a chance for us to learn more about your situation and explain exactly how Homeown works. It takes around 20 minutes and is completely free with no obligation.</p>
${btn('Book your discovery call', 'https://cal.eu/homeown/discovery-call')}
${sig()}`,
  }),

  'discovery-booking-invite': (m) => ({
    subject: "Book your Homeown discovery call",
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Our team is ready to speak with you. Your discovery call is a short, no-pressure conversation — around 20 minutes — where we'll explain exactly how the Homeown pathway works and answer any questions you have.</p>
<p>Use the link below to pick a time that suits you:</p>
${btn('Book your discovery call', 'https://cal.eu/homeown/discovery-call')}
<p style="font-size:13px;color:#6b7280">If none of the available times work for you, just reply to this email and we'll find something that does.</p>
${sig()}`,
  }),

  'call-booked-confirm': (m) => ({
    subject: 'Your discovery call is confirmed',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Your discovery call with Homeown is confirmed. We look forward to learning more about your situation and exploring how we can support your path to owning your home.</p>
${sig()}`,
  }),

  'docs-requested': (m) => {
    const docs = (m.doc_labels as string[]) ?? []
    const listHtml = docs.length > 0
      ? `<ul style="margin:12px 0;padding-left:20px">${docs.map(d => `<li style="margin-bottom:4px">${d}</li>`).join('')}</ul>`
      : ''
    const isNew = Boolean(m.is_new_account)
    const action = isNew ? 'Create your account to upload' : 'Upload documents'
    return {
      subject: 'Action needed: documents for your application',
      body: `<p>Hi ${s(m.first_name)},</p>
<p>To progress your application, we need the following documents from you:</p>
${listHtml}
<p>${isNew ? "Please create your Homeown account using the link below. Once you're in, you can upload your documents directly from your portal." : 'Please log in to your portal and upload your documents from the Documents section.'}</p>
${btn(action, s(m.portal_url))}
${sig()}`,
    }
  },

  'eligible-congratulations': (m) => ({
    subject: "You're eligible for Homeown",
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Great news. Based on your application and discovery call, our team has confirmed that you are eligible for the Homeown pathway.</p>
<p><strong>What does this mean?</strong></p>
<p>Homeown is a structured ownership pathway, not a loan, not a mortgage, and not a tenancy. Through a Designated Activity Company (DAC), Homeown co-invests in the purchase of your chosen property. You make a monthly contribution, build up a beneficial interest in the property over time, and at the end of your pathway you have the option to purchase the property at the originally agreed price.</p>
<p style="font-size:13px;color:#6b7280;border-left:3px solid #e5e7eb;padding-left:12px;margin:16px 0">Homeown is not a lender and this is not a credit product. Your monthly contributions are not debt repayments and you are not taking on a mortgage or any form of borrowing.</p>
<p><strong>What happens next?</strong></p>
<p>Our team will match you with a suitable DAC. Once matched, you'll have full access to your client portal where you can track your progress and begin your property search. We'll be in touch shortly with next steps.</p>
${btn('Go to your portal', `${SITE_URL}/#/app/client`)}
${sig()}`,
  }),

  'not-eligible-warm': (m) => ({
    subject: 'An update on your Homeown application',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Thank you for your interest in Homeown. After reviewing your details, we're not able to progress your application at this time.</p>
<p>Circumstances change, and we'd welcome you getting back in touch if your situation changes. We're rooting for you.</p>
${sig()}`,
  }),

  'deferred-stay-in-touch': (m) => ({
    subject: "We'll be in touch",
    body: `<p>Hi ${s(m.first_name)},</p>
<p>We've noted that your application is on hold for now. We'll check in at an appropriate time and would love to hear from you if anything changes in the meantime.</p>
${sig()}`,
  }),

  'in-review-notification': (m) => ({
    subject: 'Your documents are with us — we\'re reviewing your application',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Thank you for submitting your documents. Our team is now completing your programme participation review and will be in touch within 3 business days with an update.</p>
<p>In the meantime, you can log in to your portal to check the status of your documents at any time.</p>
${btn('View your portal', `${SITE_URL}/#/app/client/documents`)}
${sig()}`,
  }),

  'dac-assigned-welcome': (m) => ({
    subject: "You've been matched. Your property search begins now.",
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Exciting news. You've been matched with a Designated Activity Company (DAC) and your property search can now begin.</p>
<p>Here's how it works from here:</p>
<ul>
  <li>Find a property you love, browse the market in your own time</li>
  <li>When you're ready to move on a property, let us know and we'll engage the purchase agent on your behalf</li>
  <li>Once your holding deposit is received, Homeown will begin the purchase process</li>
</ul>
<p>Log in to your portal to view your DAC details and get started.</p>
${btn('Go to your portal', `${SITE_URL}/#/app/client`)}
${sig()}`,
  }),

  'sale-agreed-next-steps': (m) => ({
    subject: 'Sale agreed: what happens next',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Congratulations, sale agreed! Our team will now co-ordinate with solicitors to progress to contracts. We'll keep you updated every step of the way.</p>
${sig()}`,
  }),

  'contracts-signed-completion-prep': (m) => ({
    subject: 'Contracts signed: preparing for completion',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Contracts are signed, a major milestone. We're now in the final stages before you move in. Our team will be in touch with completion details shortly.</p>
${sig()}`,
  }),

  'welcome-home': (m) => ({
    subject: 'Welcome home: your pathway is live',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>You're in! Your Homeown pathway is now live from <strong>${s(m.pathway_start_date)}</strong>. This is a huge milestone and we're thrilled to be part of your journey.</p>
<p>Log in to your portal to track your timeline and upcoming milestones.</p>
${btn('View your timeline', `${SITE_URL}/#/app/client/timeline`)}
${sig()}`,
  }),

  'pathway-complete-congratulations': (m) => ({
    subject: 'Pathway complete: congratulations!',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Congratulations! You've completed your Homeown pathway. We're so proud of what you've achieved and grateful to have been part of your journey to property ownership.</p>
${sig()}`,
  }),

  'exit-confirmed': (m) => ({
    subject: 'Your Homeown exit is confirmed',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>We've confirmed your exit from the Homeown programme. We wish you all the best and hope the experience has been a positive one. Please don't hesitate to get back in touch in future.</p>
${sig()}`,
  }),

  'doc-received-confirm': (m) => {
    const docs = (m.docs as Array<{ label: string; received: boolean }>) ?? []
    const rows = docs.map(d => `
      <tr>
        <td style="padding:7px 10px 7px 0;width:24px;font-size:15px;color:${d.received ? '#16a34a' : '#9ca3af'};font-weight:700">${d.received ? '&#10003;' : '&#10007;'}</td>
        <td style="padding:7px 0;font-size:14px;color:${d.received ? '#1a1a1a' : '#6b7280'}">${d.label}</td>
      </tr>`).join('')
    return {
      subject: 'Your document status',
      body: `<p>Hi ${s(m.first_name)},</p>
<p>We've received your latest document. Here's a summary of where things currently stand:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
<p>We'll be in touch once we've reviewed everything. Please upload any outstanding documents via your portal.</p>
${btn('Upload documents', `${SITE_URL}/#/app/client/documents`)}
${sig()}`,
    }
  },

  // ── Staff ───────────────────────────────────────────────────────────────────

  'staff-invite': (m) => ({
    subject: "You've been invited to join Homeown",
    body: `<p>Hi ${s(m.first_name)},</p>
<p>You've been invited to join the Homeown team as <strong>${s(m.role_label)}</strong>. Click below to set your password and access the staff portal.</p>
${btn('Set up my account', s(m.join_url))}
<p style="font-size:13px;color:#6b7280">This link is personal. Please don't share it.</p>`,
  }),

  // ── Circle ──────────────────────────────────────────────────────────────────

  'welcome-circle': (m) => ({
    subject: 'Welcome to Homeown Circle',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Welcome to Homeown Circle. You now have access to exclusive DAC investment opportunities that make property ownership possible for our clients.</p>
${btn('Access your Circle portal', `${SITE_URL}/#/app/circle`)}
${sig()}`,
  }),

  'dac-upcoming': (m) => ({
    subject: `Coming soon: ${s(m.dac_name)}`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>A new DAC opportunity is coming soon: <strong>${s(m.dac_name)}</strong>. Log in to your Circle portal to learn more and register your interest ahead of the opening.</p>
${btn('View opportunities', `${SITE_URL}/#/app/circle/opportunities`)}
${sig()}`,
  }),

  'dac-open': (m) => ({
    subject: `Now open: ${s(m.dac_name)}`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p><strong>${s(m.dac_name)}</strong> is now open for subscriptions. Log in to your Circle portal to review the details and subscribe.</p>
${btn('View and subscribe', `${SITE_URL}/#/app/circle/opportunities`)}
${sig()}`,
  }),

  'dac-fully-funded': (m) => ({
    subject: `${s(m.dac_name)} is fully funded`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Great news. <strong>${s(m.dac_name)}</strong> has reached its funding target. The DAC is now closed to new subscriptions. We'll keep you updated on progress.</p>
${sig()}`,
  }),

  'dac-matured-redemption': (m) => ({
    subject: `${s(m.dac_name)} has matured`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p><strong>${s(m.dac_name)}</strong> has matured. Our team will be in touch shortly regarding redemption of your investment.</p>
${sig()}`,
  }),

  'subscription-soft-commit-confirm': (m) => ({
    subject: `Soft commitment received: ${s(m.dac_name)}`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>We've noted your soft commitment for <strong>${s(m.dac_name)}</strong>. This is not yet a binding subscription. We'll follow up when the DAC is ready to confirm.</p>
${btn('View portfolio', `${SITE_URL}/#/app/circle/portfolio`)}
${sig()}`,
  }),

  'subscription-confirmed': (m) => ({
    subject: `Subscription confirmed: ${s(m.dac_name)}`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Your subscription to <strong>${s(m.dac_name)}</strong> is confirmed. You'll receive updates as the DAC progresses.</p>
${btn('View portfolio', `${SITE_URL}/#/app/circle/portfolio`)}
${sig()}`,
  }),

  'funds-requested': (m) => ({
    subject: `Funds requested: ${s(m.dac_name)}`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>We've sent a funds request for your investment in <strong>${s(m.dac_name)}</strong>. Please arrange transfer of your committed amount. Our team will confirm receipt once funds have cleared.</p>
${sig()}`,
  }),

  'funds-received-confirm': (m) => ({
    subject: `Funds received: ${s(m.dac_name)}`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>We've received your investment in <strong>${s(m.dac_name)}</strong>. Your participation is fully confirmed and you'll receive updates as the DAC progresses.</p>
${btn('View portfolio', `${SITE_URL}/#/app/circle/portfolio`)}
${sig()}`,
  }),

  // ── Scheduled / milestone ───────────────────────────────────────────────────

  'deferred-revisit': (m) => ({
    subject: 'Checking in from Homeown',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>It's been a while since we last spoke. We wanted to check in and see how things are going. If your situation has changed and you'd like to explore the Homeown pathway again, we'd love to hear from you.</p>
${btn('Get back in touch', SITE_URL)}
${sig()}`,
  }),

  'domiter-reminder': (m) => ({
    subject: 'Your Domiter is due soon',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Your Domiter for this month is due in <strong>${s(m.days_until_due)} days</strong>. Please ensure your payment is arranged on time to keep your pathway on track. As always, if you have any queries or concerns, please don't hesitate to reach out.</p>
${btn('View your portal', `${SITE_URL}/#/app/client`)}
${sig()}`,
  }),

  'six-month-checkin': (m) => ({
    subject: `${s(m.months_in)} months in: a great milestone`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p>You're ${s(m.months_in)} months into your Homeown pathway, what a great milestone! We hope everything is going smoothly for you as you settle into your new home. As always, we're here if you need us or have any questions.</p>
${btn('View your timeline', `${SITE_URL}/#/app/client/timeline`)}
${sig()}`,
  }),

  'option-window-approaching': (m) => ({
    subject: 'Your purchase option window is approaching: action required',
    body: `<p>Hi ${s(m.first_name)},</p>
<p>Your purchase option window opens in <strong>30 days</strong>. To confirm your intent to proceed, please log in to your portal and complete the confirmation step.</p>
<p>A member of our team will also be in touch to walk you through what you're committing to and to introduce you to our mortgage broker partner, who can support your mortgage journey.</p>
${btn('Complete your confirmation', `${SITE_URL}/#/app/client`)}
${sig()}`,
  }),

  'dac-maturity-alert': (m) => ({
    subject: `${s(m.dac_name)} matures in ${s(m.days_until)} days`,
    body: `<p>Hi ${s(m.first_name)},</p>
<p><strong>${s(m.dac_name)}</strong> is approaching its maturity date, ${s(m.days_until)} days to go. Please ensure you're prepared for the redemption process. Our team will be in touch with details.</p>
${sig()}`,
  }),

  'sla-breach-alert': (m) => ({
    subject: `Action needed: ${s(m.client_name)} (${s(m.breach_type)})`,
    body: `<p>Hi ${s(m.staff_first_name)},</p>
<p>A client requires urgent attention.</p>
<ul>
  <li><strong>Client:</strong> ${s(m.client_name)}</li>
  <li><strong>Issue:</strong> ${s(m.breach_type)}</li>
</ul>
${btn('View client', s(m.client_url))}`,
  }),

  // ── Document delivery ───────────────────────────────────────────────────────

  'document-delivery': (m) => ({
    subject: `Your document from Homeown: ${s(m.document_name)}`,
    body: `<p>Hi ${s(m.client_name)},</p>
<p>A document has been sent to you from Homeown: <strong>${s(m.document_name)}</strong>.</p>
<p>The document is attached to this email as a PDF. You can also view it and acknowledge receipt in your Homeown portal at any time.</p>
${btn('View in portal', s(m.portal_url))}
<p style="font-size:13px;color:#6b7280">If this document requires your acknowledgement, please log in to the portal and click "Acknowledge receipt" after reading.</p>
${sig()}`,
  }),

  'document-notification': (m) => ({
    subject: `New document available: ${s(m.document_name)}`,
    body: `<p>Hi ${s(m.client_name)},</p>
<p>A new document is available for you in the Homeown portal: <strong>${s(m.document_name)}</strong>.</p>
${btn('View document', s(m.document_url))}
${sig()}`,
  }),
}

export function renderTemplate(
  template: string,
  model: Model,
): { subject: string; html: string; text: string } {
  const fn = TEMPLATES[template]
  if (!fn) {
    return wrap(
      `Message from Homeown`,
      `<p>Hi,</p><p>You have a new message from the Homeown team.</p>${sig()}`,
    )
  }
  const { subject, body } = fn(model)
  return wrap(subject, body)
}
