import { Mail, MessageCircle, Phone } from "lucide-react";

// Phase 19. Item 9 of the CRM recommendation. Plain <a> links, no
// interactivity needed — tel:/mailto: are handled by the OS. The WhatsApp
// link here opens a chat with the LEAD's own phone number (Zee reaching
// out to them), the opposite direction from Phase 17's FloatingChatButton
// (a visitor reaching Zee via his fixed CHAT_LINKS.whatsapp number), so
// it's built per-inquiry from `phone` rather than reusing that constant.
// This codebase has no Facebook Messenger API integration to link a
// specific lead through, so WhatsApp click-to-chat stands in for
// "Messenger" here.
export default function ContactActions({
  email,
  phone,
}: {
  email: string | null;
  phone: string | null;
}) {
  if (!email && !phone) return null;

  // wa.me needs digits only, no leading zero/plus — same normalization
  // Phase 17's WhatsApp button uses, assuming PH numbers (+63) when a
  // local "0"-prefixed number is entered.
  const waNumber = phone
    ? phone.replace(/[^\d]/g, "").replace(/^0/, "63")
    : null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-1.5 rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40"
        >
          <Phone size={14} /> Call
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40"
        >
          <Mail size={14} /> Email
        </a>
      )}
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40"
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      )}
    </div>
  );
}
