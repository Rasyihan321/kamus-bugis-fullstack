// Controller untuk upload & pengambilan gambar ilustrasi kata.
// Gambar TIDAK disimpan di MongoDB, melainkan di MinIO (object storage);
// MongoDB hanya menyimpan metadata (nama objek, tipe, ukuran).
const { randomUUID } = require('crypto');
const path = require('path');
const Word = require('../models/Word');
const { minioClient } = require('../config/minio');
const config = require('../config/env');

// POST /api/words/:id/image — upload gambar ilustrasi untuk sebuah kata
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File gambar (field "image") wajib diunggah' });
    }

    const word = await Word.findOne({ id: req.params.id });
    if (!word) return res.status(404).json({ message: 'Kata tidak ditemukan' });

    // Nama objek unik di bucket: <uuid><ekstensi asli>
    const ext = path.extname(req.file.originalname || '').toLowerCase() || '.png';
    const objectName = `${randomUUID()}${ext}`;

    // Simpan buffer file ke MinIO
    await minioClient.putObject(
      config.minio.bucket,
      objectName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );

    // Hapus gambar lama jika sebelumnya sudah ada (agar bucket tidak menumpuk)
    if (word.image && word.image.objectName) {
      try {
        await minioClient.removeObject(config.minio.bucket, word.image.objectName);
      } catch (e) {
        console.warn(`[minio] Gagal hapus gambar lama: ${e.message}`);
      }
    }

    // Simpan metadata gambar di dokumen MongoDB
    word.image = {
      objectName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    };
    await word.save();

    res.status(201).json({ message: 'Gambar berhasil diunggah ke MinIO', data: word });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/words/:id/image — hapus gambar ilustrasi sebuah kata
exports.deleteImage = async (req, res, next) => {
  try {
    const word = await Word.findOne({ id: req.params.id });
    if (!word) return res.status(404).json({ message: 'Kata tidak ditemukan' });
    if (!word.image || !word.image.objectName) {
      return res.status(404).json({ message: 'Kata ini tidak memiliki gambar' });
    }

    await minioClient.removeObject(config.minio.bucket, word.image.objectName);
    word.image = null;
    await word.save();

    res.json({ message: 'Gambar berhasil dihapus', data: word });
  } catch (err) {
    next(err);
  }
};

// GET /api/images/:objectName — stream gambar langsung dari MinIO
exports.getImage = async (req, res, next) => {
  try {
    const { objectName } = req.params;

    // Validasi nama objek: hanya uuid + ekstensi (cegah path traversal)
    if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(objectName)) {
      return res.status(400).json({ message: 'Nama objek tidak valid' });
    }

    const stat = await minioClient.statObject(config.minio.bucket, objectName);
    const stream = await minioClient.getObject(config.minio.bucket, objectName);

    res.setHeader('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.pipe(res);
  } catch (err) {
    if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
      return res.status(404).json({ message: 'Gambar tidak ditemukan di MinIO' });
    }
    next(err);
  }
};
