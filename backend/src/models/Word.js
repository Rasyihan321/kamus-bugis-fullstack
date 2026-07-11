// Model Mongoose untuk koleksi "words" (entri Kamus Bahasa Bugis).
// Struktur field mengikuti dataset asli kamus.words-v2.json.
const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema(
  {
    // UUID publik entri (dipakai sebagai identifier di REST API)
    id: { type: String, required: true, unique: true, index: true },

    // Jika entri ini adalah makna turunan (sub-sense), field ini berisi
    // id dari entri induknya. null = entri utama.
    related_words_id: { type: String, default: null, index: true },

    // Kata / lema Bugis (null pada entri makna turunan)
    lexem: { type: String, default: null, index: true },

    homonym_number: { type: Number, default: null },
    sub_entry: { type: String, default: null },
    phonetic_form: { type: String, default: null },

    // Kelas kata: n, v, a, adv, pron, num, p, dll.
    part_of_speech: { type: String, default: null, index: true },

    sense_number: { type: Number, default: null },
    definition: { type: String, default: null },
    example: { type: String, default: null },
    example_gloss: { type: String, default: null },

    // Metadata gambar ilustrasi yang disimpan di MinIO
    image: {
      type: new mongoose.Schema(
        {
          objectName: String, // nama objek di bucket MinIO
          originalName: String,
          mimeType: String,
          size: Number,
        },
        { _id: false }
      ),
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'words',
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// URL gambar yang bisa diakses lewat API (di-stream dari MinIO oleh backend)
wordSchema.virtual('imageUrl').get(function () {
  return this.image && this.image.objectName
    ? `/api/images/${this.image.objectName}`
    : null;
});

module.exports = mongoose.model('Word', wordSchema);
