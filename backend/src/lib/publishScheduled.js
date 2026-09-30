// Phase 27. Publishes anything whose scheduled time has arrived:
//   - Property rows with status DRAFT and publishAt <= now -> AVAILABLE
//   - Post rows with published false and publishAt <= now -> published true
//
// Processed one at a time (not updateMany) for properties, because each
// newly-AVAILABLE listing needs its own notifyMatchingSubscribers() call
// with its own row data — updateMany can't do that. Posts have no such
// side effect, so those are a single updateMany.

const prisma = require("./prisma");
const { notifyMatchingSubscribers } = require("./listingAlerts");

async function publishScheduled() {
  const now = new Date();
  let propertiesPublished = 0;
  let postsPublished = 0;

  try {
    const dueProperties = await prisma.property.findMany({
      where: { status: "DRAFT", publishAt: { lte: now } },
    });

    for (const property of dueProperties) {
      try {
        const updated = await prisma.property.update({
          where: { id: property.id },
          data: { status: "AVAILABLE", publishAt: null },
        });
        propertiesPublished += 1;
        notifyMatchingSubscribers(updated);
      } catch (err) {
        console.error(`[publish-scheduled] Failed to publish property ${property.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[publish-scheduled] Property lookup failed:", err);
  }

  try {
    const duePosts = await prisma.post.updateMany({
      where: { published: false, publishAt: { lte: now } },
      data: { published: true, publishAt: null },
    });
    postsPublished = duePosts.count;
  } catch (err) {
    console.error("[publish-scheduled] Post update failed:", err);
  }

  return { propertiesPublished, postsPublished };
}

module.exports = { publishScheduled };
