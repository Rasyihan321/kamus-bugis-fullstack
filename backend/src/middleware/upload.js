// Middleware upload file dengan multer.
// File disimpan sementara di memori (buffer) lalu diteruskan ke MinIO —
// tidak pernah ditulis ke disk server.
const multer = require('multer');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // maksimal 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipe file tidak diizinkan (hanya JPEG/PNG/WebP/GIF)'));
  },
});

module.exports = { upload };
