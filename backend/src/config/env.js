// Konfigurasi environment terpusat.
// Semua nilai bisa dioverride lewat environment variable (docker-compose / .env).
require("dotenv").config();

const path = require("path");

module.exports = {
  port: parseInt(process.env.PORT || "4000", 10),

  // Koneksi MongoDB
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/kamus_bugis",

  // Koneksi MinIO (object storage untuk gambar)
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: (process.env.MINIO_USE_SSL || "false") === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    bucket: process.env.MINIO_BUCKET || "kamus-images",
  },

  // Ollama (fitur AI contoh kalimat) — server LLM kampus Unismuh.
  // Set OLLAMA_ENABLED=false untuk mematikan; fallback data kamus tetap jalan.
  ollama: {
    enabled: (process.env.OLLAMA_ENABLED || "true") === "true",
    baseUrl: (
      process.env.OLLAMA_BASE_URL || "***URL-DISENSOR***"
    ).replace(/\/+$/, ""),
    model: process.env.OLLAMA_MODEL || "gemma3:27b",
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || "60000", 10),
  },

  // Lokasi file JSON sumber data kamus (untuk seeding awal)
  seedFile:
    process.env.SEED_FILE ||
    path.join(__dirname, "..", "..", "..", "data", "kamus.words-v2.json"),
};
