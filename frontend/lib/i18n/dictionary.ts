// Trust & polish — Tagalog (tl) and Cebuano (ceb) copy for the toggle.
//
// Keyed by the same id used in <T id="…"> / useT()("…"). English is NOT
// stored here: it lives next to the markup it belongs to, and is the
// fallback for anything missing below.
//
// REVIEW NOTE: first-draft translations, written in the natural, code-mixed
// register Filipino real-estate sites use (loanwords like "property",
// "viewing", "condo" are kept on purpose). Zee is a native Cebuano speaker —
// give the "ceb" column a read-through and fix anything that sounds stiff
// before launch. Editing a value here is all it takes; no other file needs
// to change.
//
// SCOPE: navigation, hero, category strip, closing CTA, the inquiry form,
// and the new track-record / testimonials / guides sections. Listing
// content, the blog, the About bio, and the legal pages are intentionally
// NOT translated (listing text is written per property; the bio and the
// privacy policy should be translated by Zee, not by a first draft).
type Entry = { tl: string; ceb: string };

export const DICT: Record<string, Entry> = {
  // ---- navigation (keyed by route) ----
  "nav./": { tl: "Home", ceb: "Home" },
  "nav./properties": { tl: "Mga Property", ceb: "Mga Property" },
  "nav./blog": { tl: "Balita sa Merkado", ceb: "Balita sa Merkado" },
  "nav./about": { tl: "Tungkol sa Akin", ceb: "Bahin Nako" },
  "nav./services": { tl: "Mga Serbisyo", ceb: "Mga Serbisyo" },
  "nav./testimonials": { tl: "Mga Testimonya", ceb: "Mga Testimonyal" },
  "nav./contact": { tl: "Makipag-ugnayan", ceb: "Kontaka Ko" },
  "nav.sell": { tl: "Ibenta ang Iyong Property", ceb: "Ibaligya ang Imong Property" },
  "nav.available": { tl: "Bukas para sa mga tanong", ceb: "Bukas para sa mga pangutana" },
  "nav.privacy": { tl: "Patakaran sa Privacy", ceb: "Palisiya sa Privacy" },
  "nav.tagline": { tl: "Ang iyong property. Ang iyong kinabukasan.", ceb: "Imong property. Imong kaugmaon." },

  // ---- hero ----
  "hero.line1": { tl: "Hanapin ang tamang property.", ceb: "Pangitaa ang husto nga property." },
  "hero.line2": { tl: "Buuin ang iyong kinabukasan.", ceb: "Tukora ang imong kaugmaon." },
  "hero.sub": {
    tl: "Tinutulungan ko ang mga kliyente na bumili, magbenta, at mag-invest sa mga property na akma sa kanilang pamumuhay at mga layunin — mula sa pangarap na bahay hanggang sa matalinong investment.",
    ceb: "Nagtabang ko sa mga kliyente sa pagpalit, pagbaligya, ug pag-invest sa mga property nga angay sa ilang estilo sa kinabuhi ug tumong — gikan sa damgo nga balay hangtod sa maalamon nga investment.",
  },
  "hero.browse": { tl: "Tingnan ang mga Property", ceb: "Tan-awa ang mga Property" },
  "cta.bookViewing": { tl: "Mag-book ng Viewing", ceb: "Mag-book og Viewing" },
  "hero.watch": { tl: "Panoorin ang Pagpapakilala", ceb: "Tan-awa ang Pagpaila" },
  "video.title": { tl: "Pagpapakilala", ceb: "Pagpaila" },
  "video.close": { tl: "Isara", ceb: "Sirad-i" },
  "video.external": { tl: "Buksan ang video sa bagong tab", ceb: "Ablihi ang video sa bag-ong tab" },

  // ---- category strip ----
  "cat.houses.label": { tl: "Bahay at Lupa", ceb: "Balay ug Yuta" },
  "cat.houses.caption": { tl: "Mga bahay na may lupa, handa nang tirhan", ceb: "Mga balay nga naay yuta, andam na puy-an" },
  "cat.condos.label": { tl: "Condo", ceb: "Condo" },
  "cat.condos.caption": {
    tl: "Pamumuhay sa unit sa mga pinakakonektadong lugar sa lungsod",
    ceb: "Pagpuyo sa unit sa labing konektado nga mga lugar sa siyudad",
  },
  "cat.commercial.label": { tl: "Komersyal", ceb: "Komersyal" },
  "cat.commercial.caption": {
    tl: "Mga espasyo para sa tindahan, opisina, at mixed-use para sa negosyo mo",
    ceb: "Mga luna para sa tindahan, opisina, ug mixed-use alang sa imong negosyo",
  },
  "cat.preselling.label": { tl: "Preselling", ceb: "Preselling" },
  "cat.preselling.caption": {
    tl: "Kunin ang halaga ng bukas sa presyo ngayon",
    ceb: "Kuhaa ang bili sa ugma sa presyo karon",
  },
  "cat.investment.label": { tl: "Investment", ceb: "Investment" },
  "cat.investment.caption": {
    tl: "Mga property na tumataas ang halaga sa paglipas ng panahon",
    ceb: "Mga property nga misaka ang bili sa paglabay sa panahon",
  },

  // ---- closing CTA banner ----
  "cta.heading": {
    tl: "Hanapin Natin ang Perpektong Property para sa Iyo",
    ceb: "Pangitaon Nato ang Perpekto nga Property para Nimo",
  },
  "cta.body": {
    tl: "Naghahanap ka man ng bagong tahanan, investment, o susunod na espasyo para sa negosyo, nandito ako para tumulong sa bawat hakbang.",
    ceb: "Nangita ka man og bag-ong balay, investment, o sunod nga luna para sa negosyo, ania ko aron motabang nimo sa matag lakang.",
  },
  "cta.sell": {
    tl: "Nag-iisip bang magbenta? Kumuha ng libreng valuation",
    ceb: "Naghunahuna nga mo-baligya? Pagkuha og libre nga valuation",
  },
  "cta.getInTouch": { tl: "Makipag-ugnayan", ceb: "Kontaka Ko" },

  // ---- inquiry form ----
  "inq.title": { tl: "Magpadala ng Tanong", ceb: "Pagpadala og Pangutana" },
  "inq.regarding": { tl: "Tungkol sa:", ceb: "Bahin sa:" },
  "inq.name": { tl: "Pangalan", ceb: "Ngalan" },
  "inq.email": { tl: "Email", ceb: "Email" },
  "inq.phone": { tl: "Telepono", ceb: "Telepono" },
  "inq.hint": { tl: "Maglagay ng kahit isa: email o telepono.", ceb: "Butang og bisan usa: email o telepono." },
  "inq.message": { tl: "Mensahe", ceb: "Mensahe" },
  "inq.send": { tl: "Ipadala ang Tanong", ceb: "Ipadala ang Pangutana" },
  "inq.sending": { tl: "Ipinapadala…", ceb: "Gipadala…" },
  "inq.thanks": { tl: "Salamat — naipadala na ang mensahe mo!", ceb: "Salamat — napadala na ang imong mensahe!" },
  "inq.dupTitle": { tl: "Natanggap ko na ito", ceb: "Nadawat na nako ni" },
  "inq.reply": { tl: "Babalikan kita sa lalong madaling panahon.", ceb: "Tubagon tika sa labing dali nga panahon." },
  "inq.dupReply": {
    tl: "Nasa inbox ko na ang naunang mensahe mo — naidagdag na roon ang anumang bago mong ipinadala. Babalikan kita sa lalong madaling panahon.",
    ceb: "Naa na sa inbox nako ang imong nauna nga mensahe — nadugang na didto ang bisan unsang bag-o nimong gipadala. Tubagon tika sa labing dali nga panahon.",
  },
  "inq.chat": { tl: "Mas gusto bang makipag-chat? Mag-message nang direkta:", ceb: "Mas gusto ba nimo nga makig-chat? Mag-message direkta:" },
  "inq.close": { tl: "Isara", ceb: "Sirad-i" },

  // ---- recently sold / rented ----
  "sold.eyebrow": { tl: "Mga Nakumpletong Deal", ceb: "Mga Nahuman nga Deal" },
  "sold.heading": { tl: "Kamakailang Naibenta at Naipa-upa", ceb: "Bag-o Lang Nabaligya ug Naabangan" },
  "sold.sub": {
    tl: "Sulyap sa ilan sa mga deal na natapos ko kamakailan.",
    ceb: "Silip sa pipila ka deal nga akong nahuman bag-o lang.",
  },
  "sold.sold": { tl: "Naibenta", ceb: "Nabaligya" },
  "sold.rented": { tl: "Naipa-upa", ceb: "Naabangan" },
  "sold.viewAll": { tl: "Tingnan ang lahat ng nakumpletong deal", ceb: "Tan-awa ang tanang nahuman nga deal" },
  "sold.soldCount": { tl: "naibenta", ceb: "nabaligya" },
  "sold.rentedCount": { tl: "naipa-upa", ceb: "naabangan" },
  "sold.cta": { tl: "Gusto mo bang isunod ang property mo?", ceb: "Gusto ba nimo nga ang imong property ang sunod?" },
  "sold.ctaBtn": { tl: "Kumuha ng libreng valuation", ceb: "Pagkuha og libre nga valuation" },
  "sold.empty": {
    tl: "Ilalagay dito ang mga nakumpletong deal sa lalong madaling panahon.",
    ceb: "Ibutang dinhi ang mga nahuman nga deal sa dili madugay.",
  },

  // ---- testimonials ----
  "test.eyebrow": { tl: "Mga Testimonya", ceb: "Mga Testimonyal" },
  "test.heading": { tl: "Ano ang Sabi ng mga Kliyente", ceb: "Unsay Giingon sa mga Kliyente" },
  "test.sub": {
    tl: "Ilang salita mula sa mga taong natulungan kong bumili, magbenta, at mag-invest sa real estate sa Cebu.",
    ceb: "Pipila ka pulong gikan sa mga tawo nga akong natabangan sa pagpalit, pagbaligya, ug pag-invest sa real estate sa Cebu.",
  },
  "test.emptyTitle": { tl: "Paparating na ang mga kuwento ng kliyente", ceb: "Moabot na ang mga sugilanon sa kliyente" },
  "test.emptyBody": {
    tl: "Iniipon ko pa ang mga review ng mga natulungan ko. Samantala, maaari mo akong kausapin nang direkta.",
    ceb: "Gikatigom pa nako ang mga review sa mga natabangan nako. Sa pagkakaron, pwede ka nakong makig-istorya direkta.",
  },
  "test.leave": { tl: "Mag-iwan ng review", ceb: "Pagbilin og review" },
  "test.google": { tl: "Mag-review sa Google", ceb: "Mag-review sa Google" },
  "test.facebook": { tl: "Mag-review sa Facebook", ceb: "Mag-review sa Facebook" },
  "test.readGoogle": { tl: "Basahin ang mga review sa Google", ceb: "Basaha ang mga review sa Google" },

  // ---- guides ----
  "guides.eyebrow": { tl: "Libreng Gabay", ceb: "Libre nga Giya" },
  "guides.heading": {
    tl: "Libreng gabay para sa mamimili at nagbebenta sa Cebu",
    ceb: "Libre nga giya para sa mopalit ug mobaligya sa Cebu",
  },
  "guides.sub": {
    tl: "Mga checklist na madaling sundan — ilagay ang email mo at i-download agad.",
    ceb: "Mga checklist nga sayon sundon — ibutang ang imong email ug i-download dayon.",
  },
  "guides.name": { tl: "Pangalan (opsyonal)", ceb: "Ngalan (opsyonal)" },
  "guides.email": { tl: "Email address", ceb: "Email address" },
  "guides.get": { tl: "Kunin ang checklist", ceb: "Kuhaa ang checklist" },
  "guides.getting": { tl: "Sandali lang…", ceb: "Hulat sa gamay…" },
  "guides.ready": { tl: "Handa na ang gabay mo.", ceb: "Andam na ang imong giya." },
  "guides.download": { tl: "I-download ang PDF", ceb: "I-download ang PDF" },
  "guides.english": { tl: "Nasa English ang mga gabay.", ceb: "Sa English ang mga giya." },
  "guides.consent": {
    tl: "Gagamitin ko lang ang email mo para ipadala ang gabay at, kung kinakailangan, sagutin ang mga tanong mo. Basahin ang aming",
    ceb: "Gamiton ra nako ang imong email aron ipadala ang giya ug, kung kinahanglan, tubagon ang imong mga pangutana. Basaha ang among",
  },
  "guides.privacy": { tl: "Patakaran sa Privacy", ceb: "Palisiya sa Privacy" },
  "guides.more": { tl: "Tingnan ang lahat ng gabay", ceb: "Tan-awa ang tanang giya" },
};
