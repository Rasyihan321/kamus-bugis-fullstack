// Controller CRUD untuk entri kamus (koleksi "words" di MongoDB).
const Word = require('../models/Word');
const { randomUUID } = require('crypto');

// GET /api/words — daftar kata dengan pencarian, filter, dan pagination
exports.listWords = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const { search, pos, mainOnly } = req.query;

    const filter = {};
    if (search) {
      // Cari di lema maupun definisi (case-insensitive)
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ lexem: rx }, { definition: rx }];
    }
    if (pos) filter.part_of_speech = pos;
    if (mainOnly === 'true') filter.lexem = { ...(filter.lexem || {}), $ne: null };

    const [total, items] = await Promise.all([
      Word.countDocuments(filter),
      Word.find(filter)
        .sort({ lexem: 1, sense_number: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/words/stats — statistik ringkas kamus
exports.getStats = async (req, res, next) => {
  try {
    const [total, mainEntries, withImage, byPos] = await Promise.all([
      Word.countDocuments(),
      Word.countDocuments({ lexem: { $ne: null } }),
      Word.countDocuments({ image: { $ne: null } }),
      Word.aggregate([
        { $match: { part_of_speech: { $ne: null } } },
        { $group: { _id: '$part_of_speech', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);
    res.json({ total, mainEntries, withImage, byPartOfSpeech: byPos });
  } catch (err) {
    next(err);
  }
};

// GET /api/words/:id — detail satu kata + makna turunannya
exports.getWord = async (req, res, next) => {
  try {
    const word = await Word.findOne({ id: req.params.id });
    if (!word) return res.status(404).json({ message: 'Kata tidak ditemukan' });

    // Ambil juga sub-makna yang menunjuk ke entri ini
    const relatedSenses = await Word.find({ related_words_id: word.id }).sort({
      sense_number: 1,
    });

    res.json({ data: word, relatedSenses });
  } catch (err) {
    next(err);
  }
};

// POST /api/words — tambah entri kamus baru
exports.createWord = async (req, res, next) => {
  try {
    const { lexem, definition } = req.body;
    if (!lexem || !definition) {
      return res
        .status(400)
        .json({ message: 'Field "lexem" dan "definition" wajib diisi' });
    }

    const word = await Word.create({
      id: randomUUID(),
      lexem,
      definition,
      part_of_speech: req.body.part_of_speech || null,
      phonetic_form: req.body.phonetic_form || null,
      example: req.body.example || null,
      example_gloss: req.body.example_gloss || null,
      sense_number: req.body.sense_number || 1,
      related_words_id: req.body.related_words_id || null,
    });

    res.status(201).json({ message: 'Entri kamus berhasil dibuat', data: word });
  } catch (err) {
    next(err);
  }
};

// PUT /api/words/:id — perbarui entri kamus
exports.updateWord = async (req, res, next) => {
  try {
    // Hanya field berikut yang boleh diubah lewat API
    const allowed = [
      'lexem',
      'definition',
      'part_of_speech',
      'phonetic_form',
      'example',
      'example_gloss',
      'sense_number',
    ];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const word = await Word.findOneAndUpdate({ id: req.params.id }, updates, {
      new: true,
      runValidators: true,
    });
    if (!word) return res.status(404).json({ message: 'Kata tidak ditemukan' });

    res.json({ message: 'Entri kamus berhasil diperbarui', data: word });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/words/:id — hapus entri kamus (beserta gambarnya di MinIO)
exports.deleteWord = async (req, res, next) => {
  try {
    const word = await Word.findOneAndDelete({ id: req.params.id });
    if (!word) return res.status(404).json({ message: 'Kata tidak ditemukan' });

    // Bersihkan gambar dari MinIO jika ada (best-effort)
    if (word.image && word.image.objectName) {
      const { minioClient } = require('../config/minio');
      const config = require('../config/env');
      try {
        await minioClient.removeObject(config.minio.bucket, word.image.objectName);
      } catch (e) {
        console.warn(`[minio] Gagal hapus objek: ${e.message}`);
      }
    }

    res.json({ message: 'Entri kamus berhasil dihapus', data: word });
  } catch (err) {
    next(err);
  }
};
