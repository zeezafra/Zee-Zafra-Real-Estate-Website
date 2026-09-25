const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const prisma = require("../lib/prisma");

const router = express.Router();

const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "VIEWING_SCHEDULED",
  "NEGOTIATING",
  "CLOSED_WON",
  "CLOSED_LOST",
];
const INQUIRY_SOURCES = [
  "NAV_CTA",
  "PROPERTY_PAGE",
  "CTA_BANNER",
  "VIEWING_FORM",
  "SELL_PAGE",
  "DIRECT",
];

// 0 means "all time" — see `rangeFilter` below.
const ALLOWED_RANGES = [7, 30, 90, 365, 0];
const DEFAULT_RANGE = 30;
const TOP_PROPERTIES_LIMIT = 8;

function parseRange(value) {
  const days = Number.parseInt(value, 10);
  return ALLOWED_RANGES.includes(days) ? days : DEFAULT_RANGE;
}

// Every aggregate in this file shares this base filter, and it always
// excludes spam — a blocked submission is not a lead, and counting it
// would inflate exactly the numbers Zee would use to judge which listings
// and which buttons are working. Spam gets its own standalone count
// instead (`spamBlocked`), so the filter's effect is still visible.
function rangeFilter(days) {
  const where = { spam: false };
  if (days > 0) {
    where.createdAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  }
  return where;
}

function countsByKey(rows, key, allKeys) {
  const out = Object.fromEntries(allKeys.map((k) => [k, 0]));
  for (const row of rows) {
    out[row[key]] = row._count._all;
  }
  return out;
}

// GET /api/admin/analytics?days=30
// Phase 20. The reporting half of the security-and-analytics task —
// inquiries per property, conversion/closure data, and lead sources.
//
// One endpoint rather than three, because the page renders them together
// and they share the same range filter; splitting them would mean three
// round-trips and three chances for the range to drift out of sync
// between panels.
//
// Everything here is a database aggregate (groupBy / count / one raw
// date_trunc query), never a full-table fetch reduced in JS — same
// reasoning as the Phase 19 stats endpoint, and it's what keeps this
// endpoint flat as the inbox grows.
router.get("/analytics", requireAdmin, async (req, res) => {
  const days = parseRange(req.query.days);
  const where = rangeFilter(days);

  try {
    const [
      totalAllTime,
      inRange,
      byStatusRaw,
      byTypeRaw,
      bySourceRaw,
      wonBySourceRaw,
      viewingRequests,
      spamBlocked,
      topPropertyRows,
      wonByPropertyRaw,
      closedRows,
      monthlyRaw,
      topViewedRows,
      topFavoritedRows,
    ] = await Promise.all([
      prisma.inquiry.count({ where: { spam: false } }),
      prisma.inquiry.count({ where }),
      prisma.inquiry.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.inquiry.groupBy({ by: ["type"], where, _count: { _all: true } }),
      prisma.inquiry.groupBy({ by: ["source"], where, _count: { _all: true } }),
      prisma.inquiry.groupBy({
        by: ["source"],
        where: { ...where, status: "CLOSED_WON" },
        _count: { _all: true },
      }),
      // A "viewing request" is an inquiry that named a preferred date —
      // the Phase 14 ViewingModal is the only thing that sets it.
      prisma.inquiry.count({ where: { ...where, preferredDate: { not: null } } }),
      prisma.inquiry.count({
        where: days > 0 ? { spam: true, createdAt: where.createdAt } : { spam: true },
      }),
      prisma.inquiry.groupBy({
        by: ["propertyId"],
        where: { ...where, propertyId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { propertyId: "desc" } },
        take: TOP_PROPERTIES_LIMIT,
      }),
      prisma.inquiry.groupBy({
        by: ["propertyId"],
        where: { ...where, propertyId: { not: null }, status: "CLOSED_WON" },
        _count: { _all: true },
      }),
      // Only two small columns, and only for rows that actually closed —
      // the date arithmetic itself is cheaper in JS than a raw query here,
      // and this keeps the whole file on Prisma's typed API except for
      // the month bucketing below, which Prisma can't express.
      prisma.inquiry.findMany({
        where: { ...where, closedAt: { not: null } },
        select: { createdAt: true, closedAt: true, status: true },
      }),
      // Month bucketing is the one thing Prisma's groupBy can't do (it
      // groups by column value, not by a derived expression), so this
      // drops to raw SQL. Interpolation-free — the only variable is the
      // fixed 12-month interval, written inline.
      prisma.$queryRaw`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               COUNT(*)::int AS count,
               COUNT(*) FILTER (WHERE "status" = 'CLOSED_WON')::int AS won
        FROM "Inquiry"
        WHERE "spam" = false
          AND "createdAt" >= date_trunc('month', NOW()) - INTERVAL '11 months'
        GROUP BY 1
        ORDER BY 1
      `,
      // Phase 23. `viewCount` is a running all-time counter (see the
      // schema comment), not a dated event, so — unlike topPropertyRows
      // above — this ignores `days` entirely rather than pretending to
      // respect a range it has no way to honor.
      prisma.property.findMany({
        where: { viewCount: { gt: 0 } },
        orderBy: { viewCount: "desc" },
        take: TOP_PROPERTIES_LIMIT,
        select: { id: true, refNo: true, title: true, location: true, status: true, viewCount: true },
      }),
      // Phase 24. Same all-time, range-independent framing as
      // topViewedRows above, for the same reason: favoriteCount is a
      // running counter with no per-range breakdown to show.
      prisma.property.findMany({
        where: { favoriteCount: { gt: 0 } },
        orderBy: { favoriteCount: "desc" },
        take: TOP_PROPERTIES_LIMIT,
        select: { id: true, refNo: true, title: true, location: true, status: true, favoriteCount: true },
      }),
    ]);

    const byStatus = countsByKey(byStatusRaw, "status", INQUIRY_STATUSES);
    const byType = countsByKey(byTypeRaw, "type", ["BUYER", "SELLER"]);
    const sourceCounts = countsByKey(bySourceRaw, "source", INQUIRY_SOURCES);
    const sourceWon = countsByKey(wonBySourceRaw, "source", INQUIRY_SOURCES);

    const closedWon = byStatus.CLOSED_WON;
    const closedLost = byStatus.CLOSED_LOST;
    const closedTotal = closedWon + closedLost;
    const open = inRange - closedTotal;

    // Two different questions, so two different numbers rather than one
    // ambiguous "conversion rate":
    //   conversionRate — of everything that came in, how much closed won.
    //                    Drags down while leads are still in progress.
    //   winRate        — of everything that reached a decision, how much
    //                    closed won. Ignores work in progress.
    const conversionRate = inRange > 0 ? closedWon / inRange : 0;
    const winRate = closedTotal > 0 ? closedWon / closedTotal : 0;

    const daysToClose = closedRows
      .filter((row) => row.closedAt)
      .map((row) => (row.closedAt.getTime() - row.createdAt.getTime()) / 86400000)
      // A closedAt before createdAt shouldn't be possible, but a negative
      // value would quietly poison the average if it ever were.
      .filter((value) => value >= 0);
    const avgDaysToClose =
      daysToClose.length > 0
        ? daysToClose.reduce((sum, value) => sum + value, 0) / daysToClose.length
        : null;

    const bySource = INQUIRY_SOURCES.map((source) => ({
      source,
      count: sourceCounts[source],
      won: sourceWon[source],
    }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);

    // groupBy gives ids and counts; the titles come from a second query
    // rather than an include (groupBy can't join). One extra round-trip
    // for at most TOP_PROPERTIES_LIMIT rows.
    const propertyIds = topPropertyRows.map((row) => row.propertyId);
    const properties = propertyIds.length
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds } },
          select: { id: true, refNo: true, title: true, location: true, status: true },
        })
      : [];
    const propertyById = new Map(properties.map((p) => [p.id, p]));
    const wonByProperty = new Map(
      wonByPropertyRaw.map((row) => [row.propertyId, row._count._all])
    );

    const topProperties = topPropertyRows
      .map((row) => {
        const property = propertyById.get(row.propertyId);
        // A deleted listing leaves its inquiries behind with propertyId
        // set to NULL (onDelete: SetNull), so this shouldn't fire — but a
        // missing row would otherwise crash the whole page.
        if (!property) return null;
        return {
          id: property.id,
          refNo: property.refNo,
          title: property.title,
          location: property.location,
          status: property.status,
          inquiries: row._count._all,
          won: wonByProperty.get(row.propertyId) ?? 0,
        };
      })
      .filter(Boolean);

    const byMonth = monthlyRaw.map((row) => ({
      month: row.month,
      count: Number(row.count),
      won: Number(row.won),
    }));

    res.json({
      range: { days },
      totals: {
        allTime: totalAllTime,
        inRange,
        buyers: byType.BUYER,
        sellers: byType.SELLER,
        viewingRequests,
        spamBlocked,
        open,
      },
      byStatus,
      conversion: {
        closedWon,
        closedLost,
        closedTotal,
        conversionRate,
        winRate,
        avgDaysToClose,
      },
      bySource,
      topProperties,
      // Phase 23. All-time, unaffected by the `days` picker — see the
      // comment on the query above.
      topViewedProperties: topViewedRows.map((p) => ({
        id: p.id,
        refNo: p.refNo,
        title: p.title,
        location: p.location,
        status: p.status,
        viewCount: p.viewCount,
      })),
      // Phase 24. All-time, unaffected by the `days` picker — same reason
      // as topViewedProperties above.
      topFavoritedProperties: topFavoritedRows.map((p) => ({
        id: p.id,
        refNo: p.refNo,
        title: p.title,
        location: p.location,
        status: p.status,
        favoriteCount: p.favoriteCount,
      })),
      byMonth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
