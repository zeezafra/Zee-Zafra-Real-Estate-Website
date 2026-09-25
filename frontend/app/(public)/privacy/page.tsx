import type { Metadata } from "next";
import Link from "next/link";
import { AGENT, CONTACT_INFO, SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${AGENT.name} collects, uses, and protects information shared through this site.`,
};

// Last updated whenever this page's content last changed — bump this by
// hand alongside any real edit to the policy text below, same as the
// "[Add ...]" convention elsewhere in siteConfig.ts: honest about what's
// actually known (the date this went live) rather than computed at
// request time, which would silently drift every time the page renders.
const LAST_UPDATED = "September 19, 2026";

const h2Class = "mt-10 text-lg font-semibold text-navy dark:text-offwhite";
const h3Class = "mt-6 text-sm font-semibold uppercase tracking-wide text-navy/70 dark:text-offwhite/60";
const pClass = "mt-3 text-navy/70 dark:text-offwhite/70";
const ulClass = "mt-3 list-disc space-y-1.5 pl-5 text-navy/70 dark:text-offwhite/70";

// Zee's own /sell (seller lead) and Book a Viewing forms link here
// directly (see the consent line in SellerLeadForm.tsx and
// ViewingModal.tsx) since both collect contact details plus, for
// sellers, property specifics — the two flows this page was written to
// cover. The general "Inquire Now" contact form collects the same kind
// of data and this policy applies to it too; it just isn't singled out
// by name below the way selling and viewing are, since Zee's request was
// scoped to those two.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">
        Legal
      </p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-navy/50 dark:text-offwhite/50">
        Last updated: {LAST_UPDATED}
      </p>

      <p className={pClass}>
        {AGENT.name} Properties (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;) respects your privacy and is committed to
        protecting the personal information you share with us through this
        website ({SITE_URL}). This applies whether you&rsquo;re reaching
        out to buy, submitting your property to sell, or requesting a
        viewing. This Privacy Policy explains what information we collect,
        how we use it, and the choices you have.
      </p>
      <p className={pClass}>
        By using this website, you agree to the terms of this Privacy
        Policy.
      </p>

      <h2 className={h2Class}>1. Information We Collect</h2>

      <h3 className={h3Class}>a. Information you provide directly</h3>
      <p className={pClass}>
        When you submit a buyer or seller inquiry, a{" "}
        <Link href="/sell" className="font-medium text-gold hover:underline">
          Sell Your Property
        </Link>{" "}
        request, a Book a Viewing request, or another contact form on this
        site, we collect the information you enter, which may include:
      </p>
      <ul className={ulClass}>
        <li>Full name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>
          Your message and any property details you include (e.g.
          reference number, listing you&rsquo;re inquiring about, or, for
          a seller submission, the property type, location, and details
          you&rsquo;re selling)
        </li>
        <li>
          Inquiry type (buyer or seller) and, for a viewing request, your
          preferred date and time
        </li>
      </ul>

      <h3 className={h3Class}>b. Information stored on your device</h3>
      <ul className={ulClass}>
        <li>
          <span className="font-medium text-navy dark:text-offwhite">
            Saved listings:
          </span>{" "}
          if you use the &ldquo;Save&rdquo; feature on property listings,
          your selections are stored locally in your browser (using
          <code className="mx-1 rounded bg-navy/5 px-1.5 py-0.5 text-[0.85em] dark:bg-offwhite/10">
            localStorage
          </code>
          ) and are not transmitted to or stored on our servers. Your saved
          listings are private to your device and browser, and clearing
          your browser data will remove them.
        </li>
        <li>
          <span className="font-medium text-navy dark:text-offwhite">
            Admin session cookies:
          </span>{" "}
          if you are an authorized site administrator, a secure, HTTP-only
          session cookie is used to keep you signed in to the admin
          dashboard. This cookie is not used to track visitors and is not
          accessible to other visitors of the site.
        </li>
      </ul>

      <h3 className={h3Class}>c. Information collected automatically</h3>
      <p className={pClass}>
        Like most websites, our hosting and infrastructure providers (see
        Section 5) may automatically log standard technical data such as IP
        address, browser type, device type, pages visited, and timestamps,
        for security and performance purposes.
      </p>

      <h2 className={h2Class}>2. How We Use Your Information</h2>
      <p className={pClass}>We use the information we collect to:</p>
      <ul className={ulClass}>
        <li>
          Respond to your buyer or seller inquiries and follow up about
          properties
        </li>
        <li>
          Coordinate and confirm property viewings you request
        </li>
        <li>Manage and communicate with you about your inquiry</li>
        <li>
          Maintain the security and proper functioning of the website and
          admin dashboard
        </li>
        <li>Improve our listings, services, and website experience</li>
        <li>Comply with legal obligations, where applicable</li>
      </ul>
      <p className={pClass}>We do not sell your personal information to third parties.</p>

      <h2 className={h2Class}>3. How We Share Your Information</h2>
      <p className={pClass}>
        We may share your information only in the following circumstances:
      </p>
      <ul className={ulClass}>
        <li>
          With the property owner or agent involved in the transaction,
          when necessary to facilitate a listing inquiry, viewing, or offer
        </li>
        <li>
          With service providers who help operate the site (see Section
          5), solely to provide their service to us
        </li>
        <li>
          When required by law, such as to comply with a legal obligation,
          court order, or government request
        </li>
        <li>
          To protect our rights, such as investigating fraud or enforcing
          our terms
        </li>
      </ul>
      <p className={pClass}>
        We do not share seller or buyer contact details with unrelated
        third parties, and we only pass along your information to a
        counterparty in a transaction when doing so is necessary to move
        your inquiry forward.
      </p>

      <h2 className={h2Class}>4. Data Retention</h2>
      <p className={pClass}>
        We retain inquiry information for as long as needed to respond to
        your request, facilitate the transaction, and maintain reasonable
        business records, after which it may be archived or deleted. You
        may request earlier deletion at any time (see Section 7).
      </p>

      <h2 className={h2Class}>5. Third-Party Services</h2>
      <p className={pClass}>
        This website relies on the following third-party service
        providers, each of which processes limited technical data as part
        of delivering their service:
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-navy/10 dark:border-offwhite/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-navy/5 dark:bg-offwhite/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-navy dark:text-offwhite">
                Provider
              </th>
              <th className="px-4 py-3 font-semibold text-navy dark:text-offwhite">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10 dark:divide-offwhite/10">
            <tr>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">Vercel</td>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">
                Website hosting (frontend)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">Render</td>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">
                Application hosting (backend/API) and database (PostgreSQL)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">
                Cloudinary
              </td>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">
                Storage and delivery of property images
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">
                Cloudflare Turnstile
              </td>
              <td className="px-4 py-3 text-navy/70 dark:text-offwhite/70">
                Spam/bot verification on the inquiry, seller, and viewing
                request forms
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={pClass}>
        We do not currently use third-party analytics or advertising
        services on this site. Internal view and favorite counts shown on
        the admin dashboard are computed from our own database and are not
        shared with or sourced from any outside analytics provider. Each
        provider above has its own privacy practices, and we encourage you
        to review them if you&rsquo;d like more detail.
      </p>

      <h2 className={h2Class}>6. Cookies</h2>
      <p className={pClass}>
        We use only the cookies necessary for the site to function,
        specifically a secure session cookie for admin login. We do not use
        advertising, tracking, or analytics cookies.
      </p>

      <h2 className={h2Class}>7. Your Rights</h2>
      <p className={pClass}>Depending on your location, you may have the right to:</p>
      <ul className={ulClass}>
        <li>Request access to the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your information</li>
        <li>Withdraw consent to further contact</li>
      </ul>
      <p className={pClass}>
        If you are located in the Philippines, these rights are provided
        under the Data Privacy Act of 2012 (Republic Act No. 10173). To
        exercise any of these rights, contact us using the details in
        Section 9.
      </p>

      <h2 className={h2Class}>8. Data Security</h2>
      <p className={pClass}>
        We take reasonable technical and organizational measures to
        protect your information, including secure (HTTPS) connections,
        encrypted admin authentication, and access controls on our admin
        dashboard. However, no method of transmission or storage is 100%
        secure, and we cannot guarantee absolute security.
      </p>

      <h2 className={h2Class}>9. Contact Us</h2>
      <p className={pClass}>
        If you have questions about this Privacy Policy or wish to
        exercise your data rights, please contact:
      </p>
      <div className="mt-4 rounded-2xl border border-navy/10 bg-white p-5 dark:border-offwhite/10 dark:bg-navy-light">
        <p className="font-semibold text-navy dark:text-offwhite">
          {AGENT.name} Properties
        </p>
        <p className="mt-2 text-navy/70 dark:text-offwhite/70">
          Email:{" "}
          <a href={`mailto:${CONTACT_INFO.email}`} className="text-gold hover:underline">
            {CONTACT_INFO.email}
          </a>
        </p>
        <p className="mt-1 text-navy/70 dark:text-offwhite/70">
          Phone: {CONTACT_INFO.phone}
        </p>
        <p className="mt-1 text-navy/70 dark:text-offwhite/70">
          {CONTACT_INFO.serviceArea} — [Add exact business address]
        </p>
      </div>

      <h2 className={h2Class}>10. Changes to This Policy</h2>
      <p className={pClass}>
        We may update this Privacy Policy from time to time to reflect
        changes in our practices or for legal reasons. The &ldquo;Last
        updated&rdquo; date at the top of this page will reflect the most
        recent revision.
      </p>
    </main>
  );
}
