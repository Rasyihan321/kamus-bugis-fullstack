// Helper pemanggilan REST API backend.
// Semua request diarahkan ke /api/... (di-proxy oleh Next.js ke Express).

async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
  return body;
}

// Daftar kata + pencarian + pagination
export async function fetchWords({
  search = "",
  pos = "",
  page = 1,
  limit = 12,
} = {}) {
  const params = new URLSearchParams({ page, limit, mainOnly: "true" });
  if (search) params.set("search", search);
  if (pos) params.set("pos", pos);
  return handle(await fetch(`/api/words?${params}`));
}

// Statistik kamus
export async function fetchStats() {
  return handle(await fetch("/api/words/stats"));
}

// Detail satu kata + makna turunan
export async function fetchWord(id) {
  return handle(await fetch(`/api/words/${id}`));
}

// Tambah entri baru
export async function createWord(data) {
  return handle(
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

// Perbarui entri
export async function updateWord(id, data) {
  return handle(
    await fetch(`/api/words/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

// Hapus entri
export async function deleteWord(id) {
  return handle(await fetch(`/api/words/${id}`, { method: "DELETE" }));
}

// Upload gambar ilustrasi (multipart) → disimpan backend ke MinIO
export async function uploadImage(id, file) {
  const form = new FormData();
  form.append("image", file);
  return handle(
    await fetch(`/api/words/${id}/image`, { method: "POST", body: form }),
  );
}

// Hapus gambar ilustrasi
export async function deleteImage(id) {
  return handle(await fetch(`/api/words/${id}/image`, { method: "DELETE" }));
}
