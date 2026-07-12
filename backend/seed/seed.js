// Seeder: memuat dataset kamus.words-v2.json (ekspor MongoDB berisi
// 11.745 entri kamus Bugis) ke koleksi "words".
//
// Dipakai dua cara:
//   1. Otomatis saat server start (seedIfEmpty — hanya jika koleksi kosong)
//   2. Manual: `npm run seed` (menghapus isi koleksi lalu memuat ulang)
const fs = require("fs");
const config = require("../src/config/env");

// Konversi satu baris data mentah → dokumen Word.
// Field _id ($oid) dari ekspor asli dibuang; biarkan MongoDB membuat baru.
// Beberapa keanehan dataset asli dinormalisasi di sini:
//   - definition kadang berupa array (mis. ["regang","tegang"]) → digabung "; "
//   - homonym_number kadang berisi string kata (salah kolom) → dianggap null
//   - phonetic_form kadang berupa angka → diubah jadi string
function toDoc(raw) {
  return {
    id: raw.id,
    related_words_id: raw.related_words_id ?? null,
    lexem: raw.lexem ?? null,
    homonym_number: Number.isInteger(raw.homonym_number)
      ? raw.homonym_number
      : null,
    sub_entry: raw.sub_entry ?? null,
    phonetic_form: raw.phonetic_form == null ? null : String(raw.phonetic_form),
    // Normalisasi kelas kata (dataset asli ada yang berspasi, mis. " v", "n ")
    part_of_speech: raw.part_of_speech
      ? String(raw.part_of_speech).trim()
      : null,
    sense_number: raw.sense_number ?? null,
    definition: Array.isArray(raw.definition)
      ? raw.definition.join("; ")
      : (raw.definition ?? null),
    example: raw.example ?? null,
    example_gloss: raw.example_gloss ?? null,
    image: null,
  };
}

function loadDataset() {
  const file = config.seedFile;
  if (!fs.existsSync(file)) {
    throw new Error(`File seed tidak ditemukan: ${file}`);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return raw.map(toDoc);
}

// Seed hanya jika koleksi masih kosong (aman dipanggil setiap start)
async function seedIfEmpty() {
  const Word = require("../src/models/Word");
  const count = await Word.estimatedDocumentCount();
  if (count > 0) {
    console.log(
      `[seed] Koleksi words sudah berisi ${count} dokumen — lewati seeding`,
    );
    return;
  }

  const docs = loadDataset();
  console.log(`[seed] Memuat ${docs.length} entri kamus ke MongoDB...`);
  await Word.insertMany(docs, { ordered: false });
  const inserted = await Word.countDocuments();
  if (inserted !== docs.length) {
    console.warn(
      `[seed] PERINGATAN: hanya ${inserted}/${docs.length} dokumen yang masuk`,
    );
  }
  console.log(`[seed] Seeding selesai (${inserted} dokumen)`);
}

// Mode manual: reset + muat ulang seluruh dataset
async function seedFresh() {
  const Word = require("../src/models/Word");
  await Word.deleteMany({});
  const docs = loadDataset();
  console.log(`[seed] Memuat ulang ${docs.length} entri kamus...`);
  await Word.insertMany(docs, { ordered: false });
  console.log("[seed] Selesai");
}

module.exports = { seedIfEmpty, seedFresh };

// Eksekusi langsung: node seed/seed.js
if (require.main === module) {
  const { connectDB } = require("../src/config/db");
  connectDB()
    .then(seedFresh)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] Gagal:", err);
      process.exit(1);
    });
}
