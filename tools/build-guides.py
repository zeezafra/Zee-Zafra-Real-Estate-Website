"""
Builds the two downloadable lead-magnet PDFs into frontend/public/guides/.

    pip install reportlab
    python tools/build-guides.py

Edit the CONTENT below and re-run to update a guide. Keep the slugs / file
names in step with frontend/lib/guides.ts and backend/src/lib/guides.js.

Content rules used here:
  * General information only — every guide says so on page 1.
  * No percentages/deadlines beyond the well-established ones, and each is
    marked "confirm the current rule".
  * No claim of licensure: Zee's PRC licence is not on file yet. Add a line
    to FOOTER_CONTACT below once it is.
  * Built-in Helvetica has no peso sign, so amounts are written "PHP".
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, KeepTogether, PageBreak)
from reportlab.graphics.shapes import Drawing, Rect

NAVY = colors.HexColor("#0B1F3A")
GOLD = colors.HexColor("#D4AF37")
OFFWHITE = colors.HexColor("#FAF9F6")
INK = colors.HexColor("#1B2B45")
MUTED = colors.HexColor("#5B6B82")

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "guides")
FOOTER_CONTACT = "Zee Zafra Properties  |  0991 880 1873  |  zeezafraproperties@gmail.com"
REVIEWED = "Last reviewed: September 2026"

H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=NAVY, spaceAfter=4)
SUB = ParagraphStyle("sub", fontName="Helvetica", fontSize=12.5, leading=17, textColor=MUTED, spaceAfter=10)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=NAVY, spaceBefore=14, spaceAfter=6)
BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, alignment=TA_LEFT, spaceAfter=5)
ITEM = ParagraphStyle("item", parent=BODY, spaceAfter=0, leading=13.5)
NOTE = ParagraphStyle("note", parent=BODY, fontSize=9.5, leading=13.5, spaceAfter=0)


def box():
    d = Drawing(11, 11)
    d.add(Rect(0.5, 0.5, 10, 10, strokeColor=NAVY, strokeWidth=1.1, fillColor=colors.white))
    return d


def checklist(items):
    rows = [[box(), Paragraph(t, ITEM)] for t in items]
    t = Table(rows, colWidths=[7 * mm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
        ("LEFTPADDING", (0, 0), (0, -1), 1),
        ("LEFTPADDING", (1, 0), (1, -1), 3),
    ]))
    return t


def bullets(items):
    rows = [[Paragraph("&bull;", ITEM), Paragraph(t, ITEM)] for t in items]
    t = Table(rows, colWidths=[6 * mm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def note(title, text, accent=GOLD):
    t = Table([[Paragraph(f"<b>{title}</b><br/>{text}", NOTE)]], colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F6F1DF")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def build(filename, title, subtitle, story_items, short_title):
    path = os.path.join(OUT_DIR, filename)
    os.makedirs(OUT_DIR, exist_ok=True)
    W, H = A4

    def chrome(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, H - 16 * mm, W, 16 * mm, stroke=0, fill=1)
        canvas.setFillColor(GOLD)
        canvas.setFont("Helvetica-Bold", 11)
        canvas.drawString(18 * mm, H - 10.2 * mm, "ZEE ZAFRA")
        canvas.setFillColor(OFFWHITE)
        canvas.setFont("Helvetica", 11)
        canvas.drawString(18 * mm + 66, H - 10.2 * mm, "PROPERTIES")
        canvas.setFont("Helvetica", 8.5)
        canvas.drawRightString(W - 18 * mm, H - 10.2 * mm, short_title)
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(1.2)
        canvas.line(0, H - 16 * mm, W, H - 16 * mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(18 * mm, 10 * mm, FOOTER_CONTACT)
        canvas.drawRightString(W - 18 * mm, 10 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                          topMargin=24 * mm, bottomMargin=18 * mm,
                          title=title, author="Zee Zafra Properties", subject=short_title)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=chrome)])

    story = [Paragraph(title, H1), Paragraph(subtitle, SUB),
             Paragraph(REVIEWED, ParagraphStyle("rev", parent=BODY, fontSize=8.5, textColor=MUTED)),
             Spacer(1, 4)]
    for item in story_items:
        kind, payload, extra = item[0], item[1], item[2:]
        if kind == "h":
            story.append(Paragraph(payload, H2))
        elif kind == "p":
            story.append(Paragraph(payload, BODY))
        elif kind == "c":
            story.append(checklist(payload)); story.append(Spacer(1, 3))
        elif kind == "b":
            story.append(bullets(payload)); story.append(Spacer(1, 3))
        elif kind == "note":
            story.append(Spacer(1, 4)); story.append(note(*payload, *extra)); story.append(Spacer(1, 6))
        elif kind == "pb":
            story.append(PageBreak())
    doc.build(story)
    print("wrote", os.path.normpath(path))


DISCLAIMER = ("General information only",
              "This checklist is a starting point, not legal, tax, or financial advice. Laws, fees, and government "
              "procedures change and vary by city. Confirm the details for your own deal with a lawyer, the BIR, "
              "the local Registry of Deeds, and the city or municipal offices involved.")

# ---------------------------------------------------------------- BUYING
BUYING = [
    ("note", DISCLAIMER),
    ("h", "1. Before you start shopping"),
    ("c", [
        "Set a total budget, not just a price: add closing costs (taxes, transfer and registration fees, notarial fees) and moving-in costs.",
        "Decide the purpose: a home to live in, a rental or investment, or a business space. It changes what &quot;good&quot; looks like.",
        "Choose how you will pay: cash, bank loan, Pag-IBIG housing loan, or developer financing. Ask about pre-approval before you fall in love with a unit.",
        "Write your must-haves and deal-breakers: bedrooms, lot or floor area, commute, schools, parking, flood-free access.",
        "Shortlist areas. Compare 2-3 neighborhoods on price per square metre, travel time, and future developments.",
    ]),
    ("note", ("Buying from abroad (OFW families)",
              "You can do most of this remotely. Ask for video viewings, and if you need someone to sign or transact "
              "for you, use a properly executed and notarized Special Power of Attorney (SPA) prepared with a lawyer, "
              "and processed for use abroad as required (apostille or consularization). Keep proof of your income "
              "and remittances handy for loan applications.")),
    ("h", "2. Viewing checklist"),
    ("p", "<b>The site and neighborhood</b>"),
    ("c", [
        "Ask neighbors or the barangay about flooding, especially after heavy rain. Look for water marks on walls and gates.",
        "Check road access, drainage, and whether the street floods or is prone to traffic at rush hour.",
        "Confirm water source and pressure, electricity, internet options, and mobile signal.",
        "Visit at different times of day (morning, evening, weekend) to judge noise and traffic.",
        "For subdivisions and condos, ask about monthly association or condo dues and what they cover.",
    ]),
    ("p", "<b>The house or unit</b>"),
    ("c", [
        "Look for roof leaks, wall cracks, damp patches, termite damage, and uneven floors.",
        "Test faucets, drains, water heater, switches, outlets, and the electrical panel.",
        "Open every door and window. Check locks, gates, and fences.",
        "For condos: elevators, parking allocation, fire exits, building maintenance, and the unit's orientation.",
        "Take photos and notes at each viewing so you can compare properly later.",
    ]),
    ("pb", None),
    ("h", "3. Verify the property and the seller"),
    ("p", "This is the step that protects your money. Do not pay a reservation or down payment until the basics below check out."),
    ("c", [
        "Ask for a copy of the title (TCT for house and lot, CCT for condo). The name on it should match the seller's valid ID.",
        "Get a Certified True Copy of the title from the Registry of Deeds to confirm it is authentic and to see any annotations: mortgage, adverse claim, lis pendens, or other liens.",
        "If the seller is not the registered owner, require a valid written authority (for example an SPA) and verify it. If the owner has passed away, ask for the extrajudicial settlement of estate and proof the estate tax was dealt with.",
        "If the property is co-owned or conjugal, all owners (and spouse, where required) must sign.",
        "Check the latest Tax Declaration and proof that real property tax is paid up to date. Ask for a tax clearance.",
        "Confirm boundaries. Compare the title's technical description with the lot on the ground, and consider a relocation survey by a geodetic engineer.",
        "Ask who occupies the property and whether it will be delivered vacant.",
        "Check the zoning or land-use classification with the city planning office if you plan to build, renovate, or run a business. Agricultural land may need conversion clearances before it can be used otherwise.",
        "For condos: request the Master Deed and Declaration of Restrictions, house rules, and a certificate showing no unpaid dues.",
    ]),
    ("note", ("Buying pre-selling or new-development units",
              "Ask to see the developer's License to Sell and Certificate of Registration issued by DHSUD "
              "(Department of Human Settlements and Urban Development, formerly HLURB), plus the project's "
              "development permit. Check the developer's track record on completed projects, the promised turnover "
              "date, and what happens if it slips. If you pay in installments, ask a lawyer how the Maceda Law "
              "(RA 6552) protections apply to your contract. For any &quot;assume balance&quot; or resale of "
              "rights, get the developer's written approval of the transfer.")),
    ("h", "4. Making the deal"),
    ("c", [
        "Put your offer in writing, with the price, payment terms, what is included (fixtures, parking, furniture), and the turnover date.",
        "Get an official receipt for any reservation fee, and know in writing whether it is refundable and under what conditions.",
        "Have a lawyer review the Contract to Sell (installments) or the Deed of Absolute Sale (full payment) before you sign.",
        "Use traceable payments (bank transfer or manager's check) and get a receipt every time. Avoid large cash handovers.",
        "Agree in writing who pays which closing costs. It is negotiable, and disputes here are common.",
    ]),
    ("h", "5. Closing costs and transfer, in plain steps"),
    ("p", "The exact amounts and who pays depend on your deal. As a rough map of what usually happens:"),
    ("b", [
        "<b>Taxes and fees to expect:</b> capital gains tax (usually paid by the seller), documentary stamp tax, local transfer tax, Registry of Deeds registration fee, and notarial fees. Rates and computation bases (selling price vs. zonal value vs. assessed value) change, so confirm current rules with the BIR and the city treasurer.",
        "<b>Step 1:</b> Sign and notarize the Deed of Absolute Sale.",
        "<b>Step 2:</b> Pay the applicable taxes to the BIR and secure the Certificate Authorizing Registration (CAR / eCAR).",
        "<b>Step 3:</b> Pay the transfer tax at the city or municipal treasurer's office.",
        "<b>Step 4:</b> Register the deed with the Registry of Deeds so a new title is issued in your name.",
        "<b>Step 5:</b> Have the tax declaration transferred at the city or municipal assessor's office.",
    ]),
    ("h", "6. Financing paperwork (typical)"),
    ("c", [
        "Two valid government IDs, TIN, and proof of civil status.",
        "Proof of income: payslips or certificate of employment, income tax return, bank statements. Self-employed buyers usually need business documents.",
        "For OFWs: employment contract, proof of remittances, and your SPA if someone will transact for you.",
        "For Pag-IBIG loans: active membership and contribution record. Requirements and loan limits change, so check the current rules.",
        "Ask the lender about the property appraisal, the loan-to-value ratio, and required insurance.",
    ]),
    ("h", "7. Before you move in"),
    ("c", [
        "Do a final walkthrough and list every defect to be fixed before turnover. Take photos.",
        "Receive and safely keep the original documents: title, tax declaration, contract, and all receipts.",
        "Transfer utility accounts and note the meter readings on the day of turnover.",
        "Notify the homeowners' association or condo administration and settle any move-in requirements.",
        "Arrange property insurance (fire and other risks).",
    ]),
    ("note", ("Red flags: slow down or walk away if you see these",
              "The seller will not show the title or a certified copy. The price is far below similar listings. You "
              "are pressured to pay in cash today. The seller's name does not match the title and there is no "
              "authority document. The title has annotations nobody can explain. The seller refuses a notarized "
              "contract or official receipts.", colors.HexColor("#B23A3A"))),
    ("h", "Want a second pair of eyes?"),
    ("p", "If you are considering a property in Cebu City, Talisay City, or nearby, message me and I will help you "
          "shortlist, arrange viewings, and go through this checklist with you. For legal and tax questions, "
          "always involve a lawyer."),
]

# --------------------------------------------------------------- SELLING
SELLING = [
    ("note", DISCLAIMER),
    ("h", "1. Get clear on your goal"),
    ("c", [
        "Why are you selling, and by when? A firm deadline changes how you price and negotiate.",
        "Know what you need to walk away with after paying off any loan, taxes, and costs.",
        "Confirm who has to agree: every registered owner, the spouse where the property is conjugal, or all heirs if it is inherited.",
        "If the property is mortgaged, ask the bank how a sale and release of mortgage works, and what it needs from you.",
    ]),
    ("h", "2. Gather your documents early"),
    ("p", "Missing papers are the most common reason a sale stalls. Start this before you list."),
    ("c", [
        "Owner's duplicate copy of the title (TCT or CCT), and a recent Certified True Copy from the Registry of Deeds.",
        "Latest Tax Declaration and proof that real property tax is paid up to date, plus a tax clearance.",
        "Valid IDs and TIN of every seller. Marriage certificate if applicable.",
        "If inherited: death certificate and the extrajudicial settlement of estate, with proof the estate tax was settled.",
        "If someone is signing for you: a properly notarized Special Power of Attorney. Sellers abroad should have it processed for use in the Philippines as required.",
        "For condos: certificate of no unpaid dues and the association's clearance.",
        "For a property with a house or building: building or occupancy permits, and any approved plans you have.",
        "If there is a mortgage: loan documents and the bank's written requirements for release.",
    ]),
    ("h", "3. Price it to sell"),
    ("c", [
        "Look at recent asking and closed prices for similar properties in the same area, not just what you paid or hoped for.",
        "Be honest about condition, age, flood exposure, access, and the neighborhood.",
        "Remember that government valuations (such as the zonal value) set a tax floor but are not the same as market price.",
        "Expect negotiation. Decide your lowest acceptable price before viewings begin.",
        "A listing priced too high sits, gets stale, and usually sells for less later. Review the price if you get few viewings in the first few weeks.",
    ]),
    ("pb", None),
    ("h", "4. Prepare the property"),
    ("c", [
        "Declutter, deep clean, and do the small repairs: leaks, paint touch-ups, broken locks, working lights.",
        "Improve curb appeal: clean the gate, trim plants, clear the frontage.",
        "Take good photos in daylight and consider a short walkthrough video.",
        "Be upfront about known issues (flooding, boundary questions, occupants). Surprises found by the buyer cost you more than problems you disclosed.",
        "Settle who is occupying it and when it will be vacated.",
    ]),
    ("h", "5. Market it and stay safe"),
    ("c", [
        "Write an accurate description with the location, lot or floor area, key features, and the asking price.",
        "Share it in more than one place: online listings, social media, and your network.",
        "Screen buyers before viewings. Ask whether they are paying cash or need financing and whether they are pre-approved.",
        "Never hand over your original title or documents before the deal is properly signed and paid. Give copies for review.",
        "Arrange viewings in daylight and do not leave visitors alone in the property.",
    ]),
    ("h", "6. Offers and negotiation"),
    ("c", [
        "Ask for offers in writing: price, payment schedule, and timeline.",
        "Agree in writing who pays which closing costs. It is negotiable.",
        "Get a reservation fee and a receipt. State whether and when it is refundable.",
        "If the buyer needs a loan, agree on a realistic approval timeline and what happens if it is declined.",
        "Do not accept &quot;assume balance&quot; or side deals without your lender's written approval.",
    ]),
    ("h", "7. Closing costs and taxes, in plain steps"),
    ("b", [
        "<b>Costs you may face as seller:</b> capital gains tax, and sometimes other fees depending on your agreement (for example documentary stamp tax, transfer tax, and registration fees are often assigned to the buyer, but this is negotiable). Confirm current rules and rates with the BIR and your local offices.",
        "<b>Capital gains tax:</b> for an individual selling real property held as a capital asset, it is computed on the higher of the selling price or the government's zonal or assessed value. The return has a short deadline after notarization (about 30 days), and late filing brings surcharges and interest. If the property is held as an ordinary asset (for example, by a real estate business), different rules apply.",
        "<b>Selling your home?</b> There is a possible exemption when the property was your principal residence and you reinvest the proceeds in a new principal residence within the required period and notify the BIR on time. Ask the BIR or your lawyer whether you qualify.",
        "<b>Step 1:</b> Sign and notarize the Deed of Absolute Sale.",
        "<b>Step 2:</b> File and pay the taxes at the BIR and obtain the Certificate Authorizing Registration (CAR / eCAR).",
        "<b>Step 3:</b> Transfer tax is paid at the city or municipal treasurer's office, and the deed is registered with the Registry of Deeds so the title moves to the buyer.",
    ]),
    ("h", "8. After the sale"),
    ("c", [
        "Turn over keys and possession only when the agreed payment has cleared. Do not rely on a check that has not cleared.",
        "Record final utility readings and close or transfer your accounts.",
        "Settle any association or condo dues up to turnover.",
        "Keep copies of the signed deed, receipts, and tax payments for your records.",
        "Confirm the transfer was registered and the new title issued.",
    ]),
    ("note", ("Watch out for these",
              "A buyer who wants to skip the notary or registration. A manager's check that has not been verified "
              "with the bank. &quot;Overpayment&quot; and refund requests. Proof-of-funds documents you cannot "
              "verify. Anyone pressuring you to hand over the original title before full payment. "
              "Verbal-only agreements.", colors.HexColor("#B23A3A"))),
    ("h", "Thinking of selling in Cebu City or Talisay?"),
    ("p", "I can give you a free, no-obligation view of how your property is likely to price and how I would "
          "market it. For legal and tax questions, always involve a lawyer."),
]

if __name__ == "__main__":
    build("buying-property-in-cebu-checklist.pdf",
          "Buying Property in Cebu",
          "A step-by-step checklist for first-time buyers and OFW families.",
          BUYING, "Buyer's Checklist")
    build("selling-property-in-cebu-checklist.pdf",
          "Selling Your Property in Cebu",
          "A practical checklist from first decision to closing.",
          SELLING, "Seller's Checklist")
