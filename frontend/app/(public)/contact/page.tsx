import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Linkedin } from "lucide-react";
import { AGENT, CONTACT_INFO, SOCIAL_LINKS } from "@/lib/siteConfig";

// CONTACT_INFO.phone displays both of Zee's numbers ("0991 880 1873 /
// 0928 481 9716"), but a tel: href can only dial one — this pulls just the
// digits of the first number so the "Phone" card stays clickable instead of
// building a malformed tel: link out of the full display string.
const primaryPhoneDigits = CONTACT_INFO.phone.split("/")[0].replace(/\D/g, "");

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${AGENT.name}, ${AGENT.role.toLowerCase()}.`,
};

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  mail: Mail,
};

// No inquiry form here yet — that's Phase 10's job (POST /api/inquiries +
// an Inquiry table). Rather than ship a form with no backend to submit to,
// this page leans on direct contact channels for now and says so plainly,
// same as TopNav's "Inquire Now" and the CTA banner's "Get in Touch" both
// landing here in the meantime.
export default function ContactPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">
        Contact
      </p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
        Let&rsquo;s Talk Property
      </h1>
      <p className="mt-3 max-w-2xl text-navy/60 dark:text-offwhite/60">
        Whether you&rsquo;re looking for a new home, an investment, or your
        next business space, reach out directly below and I&rsquo;ll get
        back to you.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <a
          href={`tel:${primaryPhoneDigits}`}
          className="flex items-start gap-4 rounded-2xl border border-navy/10 bg-white p-6 transition hover:border-gold dark:border-offwhite/10 dark:bg-navy-light"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
            <Phone size={18} />
          </span>
          <div>
            <p className="font-semibold text-navy dark:text-offwhite">Phone</p>
            <p className="mt-1 text-navy/60 dark:text-offwhite/60">
              {CONTACT_INFO.phone}
            </p>
          </div>
        </a>

        <a
          href={`mailto:${CONTACT_INFO.email}`}
          className="flex items-start gap-4 rounded-2xl border border-navy/10 bg-white p-6 transition hover:border-gold dark:border-offwhite/10 dark:bg-navy-light"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
            <Mail size={18} />
          </span>
          <div>
            <p className="font-semibold text-navy dark:text-offwhite">Email</p>
            <p className="mt-1 text-navy/60 dark:text-offwhite/60">
              {CONTACT_INFO.email}
            </p>
          </div>
        </a>

        <div className="flex items-start gap-4 rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
            <MapPin size={18} />
          </span>
          <div>
            <p className="font-semibold text-navy dark:text-offwhite">
              Service Area
            </p>
            <p className="mt-1 text-navy/60 dark:text-offwhite/60">
              {CONTACT_INFO.serviceArea}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
            <Clock size={18} />
          </span>
          <div>
            <p className="font-semibold text-navy dark:text-offwhite">
              Availability
            </p>
            <p className="mt-1 text-navy/60 dark:text-offwhite/60">
              {CONTACT_INFO.hours}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-5 rounded-2xl border border-navy/10 bg-navy/[0.03] p-6 dark:border-offwhite/10 dark:bg-white/[0.02]">
        <div className="flex gap-4">
          {SOCIAL_LINKS.map((social) => {
            const Icon = SOCIAL_ICONS[social.icon];
            return (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy/70 transition hover:border-gold hover:text-gold dark:border-offwhite/15 dark:text-offwhite/70"
              >
                <Icon size={18} />
              </a>
            );
          })}
        </div>
        <p className="text-sm text-navy/60 dark:text-offwhite/60">
          Prefer messaging? An online inquiry form is on its way — for now,
          phone, email, or social are the fastest ways to reach me.
        </p>
      </div>
    </main>
  );
}
