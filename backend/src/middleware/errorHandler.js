// Middleware penanganan error terpusat.
const multer = require('multer');

// 404 untuk rute yang tidak dikenal
function notFound(req, res) {
  res.status(404).json({ message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan` });
}

// Error handler umum (dipasang paling akhir)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Error dari multer (misal file terlalu besar)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload gagal: ${err.message}` });
  }
  // Error validasi Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  // Duplikat key MongoDB
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Data duplikat (id sudah ada)' });
  }

  console.error('[error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan pada server' });
}

module.exports = { notFound, errorHandler };
