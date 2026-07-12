// Smoke test API tanpa Docker: MongoDB in-memory + supertest.
// Menguji seluruh alur CRUD kamus (endpoint gambar butuh MinIO, diuji via Docker).
// Jalankan: npm test
const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  // Siapkan MongoDB in-memory lalu arahkan koneksi backend ke sana
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("kamus_bugis_test");

  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGODB_URI);

  const request = require("supertest");
  const app = require("../src/app");

  let passed = 0;
  const check = (name, cond) => {
    if (!cond) throw new Error(`GAGAL: ${name}`);
    passed++;
    console.log(`  OK  ${name}`);
  };

  // 1. Health check
  let res = await request(app).get("/health");
  check("GET /health -> 200", res.status === 200 && res.body.status === "ok");

  // 2. Swagger spec tersedia
  res = await request(app).get("/api-docs.json");
  check(
    "GET /api-docs.json -> spec OpenAPI valid",
    res.status === 200 && res.body.openapi === "3.0.3",
  );
  check("Swagger memuat path /api/words", !!res.body.paths["/api/words"]);

  // 3. Create
  res = await request(app)
    .post("/api/words")
    .send({
      lexem: "manre",
      definition: "makan",
      part_of_speech: "v",
      example: "manre ni mai",
      example_gloss: "silakan makan",
    });
  check("POST /api/words -> 201", res.status === 201);
  const created = res.body.data;
  check(
    "entri baru punya id (uuid)",
    typeof created.id === "string" && created.id.length === 36,
  );

  // 4. Validasi input
  res = await request(app).post("/api/words").send({ lexem: "x" });
  check("POST tanpa definition -> 400", res.status === 400);

  // 5. List + search
  await request(app)
    .post("/api/words")
    .send({ lexem: "bola", definition: "rumah", part_of_speech: "n" });
  res = await request(app).get("/api/words?search=manre");
  check(
    "GET /api/words?search=manre menemukan 1 hasil",
    res.status === 200 && res.body.pagination.total === 1,
  );
  res = await request(app).get("/api/words?pos=n");
  check(
    "filter ?pos=n bekerja",
    res.body.pagination.total === 1 && res.body.data[0].lexem === "bola",
  );

  // 6. Detail
  res = await request(app).get(`/api/words/${created.id}`);
  check(
    "GET /api/words/:id -> 200",
    res.status === 200 && res.body.data.lexem === "manre",
  );
  res = await request(app).get("/api/words/tidak-ada");
  check("GET id tak dikenal -> 404", res.status === 404);

  // 7. Update
  res = await request(app)
    .put(`/api/words/${created.id}`)
    .send({ definition: "makan (nasi)" });
  check(
    "PUT /api/words/:id -> definisi terubah",
    res.status === 200 && res.body.data.definition === "makan (nasi)",
  );

  // 8. Stats
  res = await request(app).get("/api/words/stats");
  check(
    "GET /api/words/stats -> total 2",
    res.status === 200 && res.body.total === 2,
  );

  // 9. Delete
  res = await request(app).delete(`/api/words/${created.id}`);
  check("DELETE /api/words/:id -> 200", res.status === 200);
  res = await request(app).get(`/api/words/${created.id}`);
  check("setelah dihapus -> 404", res.status === 404);

  await mongoose.disconnect();
  await mongod.stop();
  console.log(`\nSemua ${passed} pengujian LULUS`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
