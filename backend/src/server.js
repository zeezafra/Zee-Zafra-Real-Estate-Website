require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const corsMiddleware = require("./middleware/cors");
const healthRouter = require("./routes/health");
const propertiesRouter = require("./routes/properties");
const adminAuthRouter = require("./routes/adminAuth");
const adminPropertiesRouter = require("./routes/adminProperties");
const inquiriesRouter = require("./routes/inquiries");
const adminInquiriesRouter = require("./routes/adminInquiries");
const adminAnalyticsRouter = require("./routes/adminAnalytics");
const postsRouter = require("./routes/posts");
const adminPostsRouter = require("./routes/adminPosts");
const alertsRouter = require("./routes/alerts");
const adminAlertsRouter = require("./routes/adminAlerts");
const cronRouter = require("./routes/cron");
const guidesRouter = require("./routes/guides");
const adminGuidesRouter = require("./routes/adminGuides");

const app = express();
const PORT = process.env.PORT || 4000;

// Render sits behind a reverse proxy — without this, express-rate-limit
// (Phase 10, extended in Phase 20 to the login route) sees every request
// as coming from the proxy's IP instead of the real client, which defeats
// per-IP limiting entirely. It's also what makes req.ip correct, which
// Turnstile verification passes through as `remoteip`.
// 2 hops: Render's load balancer + the Vercel proxy in front of it, so
// req.ip is the real visitor (rate limits, Turnstile remoteip).
app.set("trust proxy", 2);

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin", adminPropertiesRouter);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/admin", adminInquiriesRouter);
app.use("/api/admin", adminAnalyticsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/admin", adminPostsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/admin", adminAlertsRouter);
app.use("/api/cron", cronRouter);
app.use("/api/guides", guidesRouter);
app.use("/api/admin", adminGuidesRouter);

// Unmatched route — JSON 404 instead of Express's default HTML page, so
// every response from this API (success or failure) is JSON.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Phase 11 hardening: a single JSON error handler for anything a route
// didn't already catch itself — malformed request bodies (express.json()
// throws a SyntaxError for bad JSON before any route runs), a rejected
// multer upload (wrong field name, too many files, a file over the 5MB
// limit in middleware/upload.js), or a genuine bug. Without this, Express
// falls back to its built-in handler, which renders an HTML page and, in
// non-production, embeds the stack trace in the response body — a minor
// info leak and inconsistent with every other response this API sends.
// Must be defined last and keep all four params (err, req, res, next) —
// Express only treats a middleware as an error handler when it has arity 4.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 5MB or smaller"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Too many images — up to 10 per upload"
          : "Image upload failed";
    return res.status(400).json({ error: message });
  }

  if (err.type === "entity.parse.failed") {
    // express.json() couldn't parse the request body.
    return res.status(400).json({ error: "Malformed request body" });
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Zee Zafra Properties API listening on port ${PORT}`);
});
