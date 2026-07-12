"use client";

// Halaman edit entri kamus.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWord, updateWord } from "../../../../lib/api";
import WordForm from "../../../../components/WordForm";

export default function EditWordPage() {
  const { id } = useParams();
  const router = useRouter();
  const [word, setWord] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWord(id)
      .then((res) => setWord(res.data))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="alert-err mt">{error}</div>;
  if (!word) return <p className="center muted mt">Memuat…</p>;

  return (
    <>
      <section className="hero">
        <h1>Edit Kata: {word.lexem}</h1>
      </section>
      <WordForm
        initial={word}
        submitLabel="Simpan Perubahan"
        onSubmit={async (payload) => {
          await updateWord(id, payload);
          router.push(`/words/${id}`);
        }}
      />
    </>
  );
}
