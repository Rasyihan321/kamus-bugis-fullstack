// Koneksi ke MongoDB menggunakan Mongoose, dengan mekanisme retry
// (penting saat berjalan di docker-compose: container Mongo mungkin
// belum sepenuhnya siap ketika backend mulai berjalan).
const mongoose = require('mongoose');
const config = require('./env');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB(maxRetries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[db] Terhubung ke MongoDB: ${config.mongodbUri}`);
      return mongoose.connection;
    } catch (err) {
      console.warn(
        `[db] Gagal konek MongoDB (percobaan ${attempt}/${maxRetries}): ${err.message}`
      );
      if (attempt === maxRetries) throw err;
      await sleep(delayMs);
    }
  }
}

module.exports = { connectDB };
