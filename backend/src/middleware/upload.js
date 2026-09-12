const multer = require("multer");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image

function imageFileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
}

// Memory storage: uploaded files stay in a Buffer and get streamed straight
// to Cloudinary in the route handler. Render's disk is ephemeral, so nothing
// here ever gets written to it, even temporarily.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: imageFileFilter,
});

module.exports = upload;
