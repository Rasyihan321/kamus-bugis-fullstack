// Titik masuk backend: konek MongoDB, siapkan bucket MinIO,
// jalankan seeding otomatis (jika koleksi kosong), lalu start server.
const app = require("./app");
const config = require("./config/env");
const { connectDB } = require("./config/db");
const { ensureBucket } = require("./config/minio");
const { seedIfEmpty } = require("../seed/seed");

async function main() {
  await connectDB();
  await ensureBucket();
  await seedIfEmpty(); // isi database dari kamus.words-v2.json bila masih kosong

  app.listen(config.port, () => {
    console.log(`[server] API berjalan di http://localhost:${config.port}`);
    console.log(
      `[server] Dokumentasi Swagger: http://localhost:${config.port}/api-docs`,
    );
  });
}

main().catch((err) => {
  console.error("[server] Gagal memulai server:", err);
  process.exit(1);
});
