"use client";

// Halaman detail kata: definisi, contoh kalimat, makna turunan,
// gambar ilustrasi (MinIO) + aksi upload/hapus gambar, edit, dan hapus entri.
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWord, deleteWord, deleteImage } from "../../../lib/api";
import ImageUploader from "../../../components/ImageUploader";
import AiExamples from "../../../components/AiExamples";

export default function WordDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [word, setWord] = useState(null);
  const [senses, setSenses] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    fetchWord(id)
      .then((res) => {
        setWord(res.data);
        setSenses(res.relatedSenses || []);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!confirm(`Hapus entri "${word.lexem}" beserta gambarnya?`)) return;
    try {
      await deleteWord(id);
      router.push("/");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteImage() {
    if (!confirm("Hapus gambar ilustrasi dari MinIO?")) return;
    try {
      await deleteImage(id);
      setNotice("Gambar dihapus dari MinIO");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="alert-err mt">{error}</div>;
  if (!word) return <p className="center muted mt">Memuat…</p>;

  return (
    <div className="detail-card">
      <h1>
        {word.lexem}
        {word.part_of_speech && (
          <span className="badge">{word.part_of_speech}</span>
        )}
      </h1>
      {word.phonetic_form && <p className="phonetic">/{word.phonetic_form}/</p>}

      {notice && <div className="alert-ok">{notice}</div>}

      {/* Gambar ilustrasi tersimpan di MinIO, di-stream lewat API */}
      {word.imageUrl && (
        <img
          className="word-image"
          src={word.imageUrl}
          alt={`Ilustrasi ${word.lexem}`}
        />
      )}

      <p className="definition">
        <b>Arti:</b> {word.definition}
      </p>

      {word.example && (
        <div className="example">
          <div>
            <b>ᨒ</b> {word.example}
          </div>
          {word.example_gloss && (
            <div className="gloss">“{word.example_gloss}”</div>
          )}
        </div>
      )}

      {senses.length > 0 && (
        <div className="senses">
          <h3>Makna lain:</h3>
          <ol start={2}>
            {senses.map((s) => (
              <li key={s.id}>
                {s.definition}
                {s.example && (
                  <div className="example">
                    <div>{s.example}</div>
                    {s.example_gloss && (
                      <div className="gloss">“{s.example_gloss}”</div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Contoh kalimat buatan AI untuk lema ini */}
      {word.lexem && <AiExamples lexem={word.lexem} />}

      {/* Upload gambar ke MinIO */}
      <ImageUploader
        wordId={id}
        hasImage={!!word.imageUrl}
        onUploaded={() => {
          setNotice("Gambar berhasil diunggah ke MinIO");
          load();
        }}
      />

      <div className="row mt">
        <Link href={`/words/${id}/edit`} className="btn btn-outline">
          ✏ Edit
        </Link>
        {word.imageUrl && (
          <button className="btn btn-outline" onClick={handleDeleteImage}>
            Hapus Gambar
          </button>
        )}
        <button className="btn btn-danger" onClick={handleDelete}>
          🗑 Hapus Entri
        </button>
        <Link href="/" className="btn btn-outline">
          ← Kembali
        </Link>
      </div>
    </div>
  );
}
