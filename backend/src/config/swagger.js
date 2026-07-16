// Konfigurasi dokumentasi Swagger / OpenAPI 3.
// Spesifikasi dibangun otomatis dari anotasi @openapi di file routes.
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API Kamus Bahasa Bugis",
      version: "1.0.0",
      description:
        "RESTful API Kamus Bahasa Bugis–Indonesia.\n\n" +
        "- **Database:** MongoDB (koleksi `words`, 11.745 entri)\n" +
        "- **Object storage gambar:** MinIO\n" +
        "- **Tugas Mata Kuliah:** Sistem Basis Data Modern\n\n" +
        "Dibuat oleh **Andi Rasyihan Jawahir** (NIM 105841111524, Kelas 4D) — " +
        "Informatika, Universitas Muhammadiyah Makassar.",
    },
    servers: [{ url: "/", description: "Server aktif" }],
    tags: [
      { name: "Words", description: "CRUD entri kamus Bugis" },
      { name: "Images", description: "Gambar ilustrasi kata (MinIO)" },
      { name: "AI", description: "Chat AI pembuat contoh kalimat Bugis" },
    ],
  },
  // Catatan: glob harus memakai forward-slash agar bekerja juga di Windows
  apis: [path.join(__dirname, "..", "routes", "*.js").replace(/\\/g, "/")],
};

module.exports = swaggerJsdoc(options);
