# 📖 Kamus Bahasa Bugis — Aplikasi Full-Stack

Tugas Mata Kuliah **Sistem Basis Data Modern**
Andi Rasyihan Jawahir · NIM 105841111524 · Kelas 4D · Informatika, Universitas Muhammadiyah Makassar

Aplikasi kamus digital Bahasa Bugis–Indonesia (11.745 entri) dengan tumpukan teknologi sesuai ketentuan tugas:

| Komponen | Teknologi |
|---|---|
| Database | **MongoDB** (Mongoose, koleksi `words`) |
| RESTful API + dokumentasi | **Express JS** + **Swagger** (OpenAPI 3, `swagger-jsdoc` + `swagger-ui-express`) |
| Web Frontend | **Next.js** (React, App Router) |
| Penyimpanan gambar | **MinIO** (object storage kompatibel S3) |
| Kontainerisasi | **Docker** + docker-compose (4 layanan) |
| Cloud dev environment | **GitHub Codespaces** (devcontainer) |

## Arsitektur

```
Browser ──▶ Frontend Next.js (:3000)
                 │  proxy /api/* (rewrites)
                 ▼
            Backend Express (:4000) ──▶ Swagger UI di /api-docs
                 │                        │
        metadata │ dokumen                │ file gambar
                 ▼                        ▼
            MongoDB (:27017)         MinIO (:9000, console :9001)
            koleksi words            bucket kamus-images
```

- Data kamus di-*seeding* otomatis dari `data/kamus.words-v2.json` saat backend pertama kali berjalan (jika koleksi masih kosong).
- Gambar ilustrasi kata **tidak disimpan di MongoDB** — file fisik masuk ke bucket MinIO, MongoDB hanya menyimpan metadata (`objectName`, tipe, ukuran), dan backend men-*stream* gambar lewat `GET /api/images/{objectName}`.

## Cara Menjalankan

### 1. GitHub Codespaces (paling mudah)

1. Push repositori ini ke GitHub.
2. Klik **Code → Codespaces → Create codespace on main**.
3. Devcontainer otomatis menjalankan `docker compose up --build -d` (lihat `.devcontainer/devcontainer.json`).
4. Buka tab **Ports**: port `3000` = web, `4000` = API/Swagger, `9001` = konsol MinIO.

### 2. Docker Compose (lokal)

```bash
docker compose up --build
```

| URL | Layanan |
|---|---|
| http://localhost:3000 | Web frontend (Next.js) |
| http://localhost:4000/api-docs | Dokumentasi Swagger |
| http://localhost:9001 | Konsol MinIO (login: `minioadmin` / `minioadmin`) |
| mongodb://localhost:27017/kamus_bugis | MongoDB |

### 3. Tanpa Docker (pengembangan)

Prasyarat: Node.js 20+, MongoDB & MinIO berjalan lokal.

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:4000/api-docs

# Frontend (terminal lain)
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Smoke test backend (MongoDB in-memory, tanpa instalasi apa pun):

```bash
cd backend && npm test
```

## Endpoint REST API

| Metode | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/words` | Daftar kata — query: `search`, `pos`, `mainOnly`, `page`, `limit` |
| POST | `/api/words` | Tambah entri kamus |
| GET | `/api/words/stats` | Statistik kamus |
| GET | `/api/words/{id}` | Detail kata + makna turunan |
| PUT | `/api/words/{id}` | Perbarui entri |
| DELETE | `/api/words/{id}` | Hapus entri (gambar di MinIO ikut dihapus) |
| POST | `/api/words/{id}/image` | Upload gambar ilustrasi → MinIO (multipart, field `image`) |
| DELETE | `/api/words/{id}/image` | Hapus gambar ilustrasi dari MinIO |
| GET | `/api/images/{objectName}` | Stream file gambar dari MinIO |

Dokumentasi interaktif lengkap: **`/api-docs`** (Swagger UI) — semua endpoint bisa dicoba langsung dari browser.

## Struktur Proyek

```
Tugas_Kamus_Bugis_MongoDB/
├── .devcontainer/devcontainer.json   # Konfigurasi GitHub Codespaces
├── docker-compose.yml                # Orkestrasi 4 layanan
├── data/kamus.words-v2.json          # Dataset kamus (11.745 entri)
├── backend/                          # Express JS API
│   ├── Dockerfile
│   ├── seed/seed.js                  # Seeder dataset → MongoDB
│   ├── test/smoke.js                 # Smoke test CRUD
│   └── src/
│       ├── server.js                 # Entry point
│       ├── app.js                    # Perakitan Express + Swagger UI
│       ├── config/                   # env, db (Mongo), minio, swagger
│       ├── models/Word.js            # Skema Mongoose
│       ├── controllers/              # Logika words & images
│       ├── middleware/               # upload (multer), error handler
│       └── routes/wordRoutes.js      # Rute + anotasi OpenAPI
└── frontend/                         # Next.js
    ├── Dockerfile                    # Multi-stage build (standalone)
    ├── next.config.mjs               # Proxy /api/* → backend
    └── src/
        ├── app/                      # Halaman (App Router)
        │   ├── page.js               # Beranda: cari + statistik
        │   └── words/[id]/           # Detail, edit; words/new: tambah
        ├── components/               # WordCard, WordForm, ImageUploader
        └── lib/api.js                # Helper pemanggilan REST API
```
