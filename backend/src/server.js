require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const corsMiddleware = require("./middleware/cors");
const healthRouter = require("./routes/health");
const propertiesRouter = require("./routes/properties");
const adminAuthRouter = require("./routes/adminAuth");
const adminPropertiesRouter = require("./routes/adminProperties");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin", adminPropertiesRouter);

app.listen(PORT, () => {
  console.log(`Zee Zafra Properties API listening on port ${PORT}`);
});
