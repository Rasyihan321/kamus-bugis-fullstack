// Klien MinIO (object storage kompatibel S3) untuk menyimpan gambar
// ilustrasi kata. Bucket dibuat otomatis saat server pertama kali jalan.
const Minio = require("minio");
const config = require("./env");

const minioClient = new Minio.Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pastikan bucket tersedia (dengan retry, menunggu container MinIO siap).
async function ensureBucket(maxRetries = 10, delayMs = 3000) {
  const { bucket } = config.minio;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        console.log(`[minio] Bucket "${bucket}" dibuat`);
      } else {
        console.log(`[minio] Bucket "${bucket}" sudah ada`);
      }
      return;
    } catch (err) {
      console.warn(
        `[minio] Gagal konek MinIO (percobaan ${attempt}/${maxRetries}): ${err.message}`,
      );
      if (attempt === maxRetries) throw err;
      await sleep(delayMs);
    }
  }
}

module.exports = { minioClient, ensureBucket };
