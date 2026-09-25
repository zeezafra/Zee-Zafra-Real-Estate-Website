const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const prisma = require("../lib/prisma");

const router = express.Router();

const INQUIRY_TYPES = ["BUYER", "SELLER"];
const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "VIEWING_SCHEDULED",
  "NEGOTIATING",
  "CLOSED_WON",
  "CLOSED_LOST",
];
const CLOSED_STATUSES = ["CLOSED_WON", "CLOSED_LOST"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayManilaISODate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

// Shared property-select shape so the list, detail, and bulk endpoints
// agree on what "enough context without a second round-trip" means.
const PROPERTY_SELECT = {
  id: true,
  title: true,
  location: true,
  refNo: true,
  status: true,
};

// GET /api/admin/inquiries/stats
// Phase 19. Deliberately its own endpoint rather than derived from the
// (filtered) list response — the stats bar always reflects the whole
// inbox regardless of whatever search/status/date filters are currently
// applied to the list below it, same way a bank balance doesn't change
// because you filtered your transaction history. Registered before
// "/inquiries/:id" so Express doesn't try to match "stats" as an :id.
router.get("/inquiries/stats", requireAdmin, async (req, res) => {
  try {
    // Phase 20: every count here now excludes spam — a flagged submission
    // isn't a lead, and letting it inflate "Total" would make the stats
    // bar disagree with the list underneath it (which hides spam too).
    // `spam` is reported separately so the Spam view's badge has a number.
    const [total, byStatusRaw, overdueFollowUps, spam] = await Promise.all([
      prisma.inquiry.count({ where: { archived: false, spam: false } }),
      prisma.inquiry.groupBy({
        by: ["status"],
        where: { archived: false, spam: false },
        _count: { _all: true },
      }),
      prisma.inquiry.count({
        where: {
          archived: false,
          spam: false,
          status: { notIn: CLOSED_STATUSES },
          nextFollowUpDate: { not: null, lt: todayManilaISODate() },
        },
      }),
      prisma.inquiry.count({ where: { spam: true } }),
    ]);

    const byStatus = Object.fromEntries(INQUIRY_STATUSES.map((s) => [s, 0]));
    for (const row of byStatusRaw) {
      byStatus[row.status] = row._count._all;
    }

    const closed = CLOSED_STATUSES.reduce((sum, s) => sum + byStatus[s], 0);

    res.json({
      total,
      new: byStatus.NEW,
      followUp: byStatus.FOLLOW_UP,
      closed,
      overdueFollowUps,
      spam,
      byStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inquiry stats" });
  }
});

// GET /api/admin/inquiries
// ?archived=true opts INTO the archive view instead of the default
// active-only list — mirrors the "explicit opt-in" shape of the other
// filters here rather than a toggle that's easy to forget is on.
router.get("/inquiries", requireAdmin, async (req, res) => {
  try {
    const { type, status, q, dateFrom, dateTo, archived, spam } = req.query;
    // Phase 20: spam is opt-in exactly like archived — the default inbox
    // shows neither, and ?spam=true is the Spam review view. Kept as its
    // own axis rather than a status value so un-flagging a false positive
    // restores the lead with its real pipeline status intact.
    const where = { archived: archived === "true", spam: spam === "true" };

    if (INQUIRY_TYPES.includes(type)) {
      where.type = type;
    }

    if (INQUIRY_STATUSES.includes(status)) {
      where.status = status;
    }

    if (typeof q === "string" && q.trim()) {
      const term = q.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { property: { title: { contains: term, mode: "insensitive" } } },
      ];
    }

    const createdAt = {};
    if (typeof dateFrom === "string" && DATE_RE.test(dateFrom)) {
      createdAt.gte = new Date(`${dateFrom}T00:00:00`);
    }
    if (typeof dateTo === "string" && DATE_RE.test(dateTo)) {
      createdAt.lte = new Date(`${dateTo}T23:59:59.999`);
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { property: { select: PROPERTY_SELECT } },
    });
    res.json(inquiries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// GET /api/admin/inquiries/:id
// Phase 19: now also returns `notes` (the activity timeline), newest
// first so the most recent call/status-change reads at the top.
router.get("/inquiries/:id", requireAdmin, async (req, res) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: PROPERTY_SELECT },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    res.json(inquiry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inquiry" });
  }
});

// PATCH /api/admin/inquiries/bulk
// Phase 19. { ids: string[], status?, archived? } — same two settable
// fields as the single-record PATCH, applied via updateMany plus a
// SYSTEM note per affected inquiry so the bulk action still shows up in
// each one's individual timeline. Registered as its own path (not
// "/inquiries/:id" with id="bulk") to keep the single-record route's
// :id param unambiguous.
router.patch("/inquiries/bulk", requireAdmin, async (req, res) => {
  const { ids, status, archived, spam } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return res.status(400).json({ error: "ids must be a non-empty array of strings" });
  }
  if (ids.length > 200) {
    return res.status(400).json({ error: "ids must be 200 or fewer at a time" });
  }

  const data = {};
  let noteContent = null;

  if (status !== undefined) {
    if (!INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${INQUIRY_STATUSES.join(", ")}`,
      });
    }
    data.status = status;
    if (status !== "NEW") {
      data.lastContactedAt = new Date();
    }
    // Phase 20: same closedAt bookkeeping as the single-record PATCH
    // below — see the comment there.
    data.closedAt = CLOSED_STATUSES.includes(status) ? new Date() : null;
    noteContent = `Status changed to ${status.replace(/_/g, " ")} (bulk action)`;
  }

  if (archived !== undefined) {
    data.archived = Boolean(archived);
    noteContent = data.archived ? "Archived (bulk action)" : "Unarchived (bulk action)";
  }

  // Phase 20. Marking a batch of junk as spam (or restoring a batch of
  // false positives) is the main way Zee will work the Spam view, so it
  // belongs on the bulk endpoint rather than one row at a time.
  if (spam !== undefined) {
    data.spam = Boolean(spam);
    noteContent = data.spam
      ? "Marked as spam (bulk action)"
      : "Marked as not spam (bulk action)";
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No updatable fields provided" });
  }

  try {
    const result = await prisma.inquiry.updateMany({ where: { id: { in: ids } }, data });

    if (noteContent) {
      await prisma.inquiryNote.createMany({
        data: ids.map((inquiryId) => ({ inquiryId, type: "SYSTEM", content: noteContent })),
      });
    }

    res.json({ updated: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update inquiries" });
  }
});


// DELETE /api/admin/inquiries/bulk
// { ids: string[] } — permanently removes a batch of inquiries (their
// InquiryNote rows cascade via the schema's onDelete: Cascade). Registered
// before "/inquiries/:id" for the same reason as the PATCH bulk route
// above: otherwise Express would try to match "bulk" as an :id on the
// DELETE :id route below. Irreversible — the frontend is expected to
// confirm with the admin before calling this.
router.delete("/inquiries/bulk", requireAdmin, async (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return res.status(400).json({ error: "ids must be a non-empty array of strings" });
  }
  if (ids.length > 200) {
    return res.status(400).json({ error: "ids must be 200 or fewer at a time" });
  }

  try {
    const result = await prisma.inquiry.deleteMany({ where: { id: { in: ids } } });
    res.json({ deleted: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete inquiries" });
  }
});

// PATCH /api/admin/inquiries/:id
// Phase 18 (status) extended in Phase 19 with nextFollowUpDate and
// archived — all three optional and independently settable (a client
// only sends the field it's actually changing). A status change beyond
// NEW auto-stamps lastContactedAt (the admin doesn't have to remember a
// separate "log contact" step) and appends a SYSTEM note so the timeline
// captures every status transition without manual logging.
router.patch("/inquiries/:id", requireAdmin, async (req, res) => {
  const { status, nextFollowUpDate, archived, spam } = req.body || {};
  const data = {};
  const systemNotes = [];

  if (status !== undefined) {
    if (!INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${INQUIRY_STATUSES.join(", ")}`,
      });
    }
    data.status = status;
    if (status !== "NEW") {
      data.lastContactedAt = new Date();
    }
    // Phase 20. Set on the way into a closed state, cleared on the way
    // back out — a lead that reopens has no close date again, and leaving
    // a stale one would quietly corrupt the average-days-to-close figure
    // in the analytics endpoint. Assigned on every status change (not
    // only closing ones) so the two can never drift apart.
    data.closedAt = CLOSED_STATUSES.includes(status) ? new Date() : null;
    systemNotes.push(`Status changed to ${status.replace(/_/g, " ")}`);
  }

  if (nextFollowUpDate !== undefined) {
    if (nextFollowUpDate !== null && !DATE_RE.test(nextFollowUpDate)) {
      return res.status(400).json({ error: "nextFollowUpDate must be in YYYY-MM-DD format" });
    }
    data.nextFollowUpDate = nextFollowUpDate;
    if (nextFollowUpDate) {
      systemNotes.push(`Follow-up scheduled for ${nextFollowUpDate}`);
    }
  }

  if (archived !== undefined) {
    data.archived = Boolean(archived);
    systemNotes.push(data.archived ? "Archived" : "Unarchived");
  }

  if (spam !== undefined) {
    data.spam = Boolean(spam);
    systemNotes.push(data.spam ? "Marked as spam" : "Marked as not spam");
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No updatable fields provided" });
  }

  try {
    await prisma.inquiry.update({ where: { id: req.params.id }, data });

    if (systemNotes.length > 0) {
      await prisma.inquiryNote.createMany({
        data: systemNotes.map((content) => ({
          inquiryId: req.params.id,
          type: "SYSTEM",
          content,
        })),
      });
    }

    const fresh = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: PROPERTY_SELECT },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });
    res.json(fresh);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update inquiry" });
  }
});

// DELETE /api/admin/inquiries/:id
// Permanently removes a single inquiry (notes cascade). Irreversible — the
// frontend confirms with the admin before calling this, same as the bulk
// route above.
router.delete("/inquiries/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.inquiry.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete inquiry" });
  }
});

// POST /api/admin/inquiries/:id/notes
// Phase 19. Manual timeline entries — a call log, an SMS follow-up, a
// viewing outcome. Separate route from the PATCH above rather than
// folding a `note` field into it, since adding a note is additive
// (append) while PATCH is always "set this field to this value."
router.post("/inquiries/:id/notes", requireAdmin, async (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";

  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: "content must be 2000 characters or fewer" });
  }

  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    await prisma.inquiryNote.create({
      data: { inquiryId: req.params.id, type: "MANUAL", content },
    });

    const fresh = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: PROPERTY_SELECT },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });
    res.status(201).json(fresh);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add note" });
  }
});

module.exports = router;
