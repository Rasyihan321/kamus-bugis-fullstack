"use client";

// Halaman tambah kata baru ke kamus.
// Setelah tersimpan di MongoDB, langsung diarahkan ke halaman detail
// agar pengguna bisa mengunggah gambar ilustrasi (MinIO).
import { useRouter } from "next/navigation";
import { createWord } from "../../../lib/api";
import WordForm from "../../../components/WordForm";

export default function NewWordPage() {
  const router = useRouter();

  return (
    <>
      <section className="hero">
        <h1>Tambah Kata Baru</h1>
        <p>
          Entri baru disimpan ke MongoDB — gambar bisa diunggah setelahnya
          (MinIO)
        </p>
      </section>
      <WordForm
        submitLabel="Simpan Kata"
        onSubmit={async (payload) => {
          const res = await createWord(payload);
          router.push(`/words/${res.data.id}`);
        }}
      />
    </>
  );
}
