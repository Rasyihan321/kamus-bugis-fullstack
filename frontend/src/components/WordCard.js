// Kartu ringkas satu kata pada daftar beranda.
import Link from "next/link";

export default function WordCard({ word }) {
  return (
    <Link href={`/words/${word.id}`}>
      <div className="word-card">
        {word.imageUrl ? (
          // Gambar ilustrasi diambil dari MinIO melalui API backend
          <img className="word-thumb" src={word.imageUrl} alt={word.lexem} />
        ) : (
          // Placeholder: huruf pertama lema
          <div className="word-thumb">
            {(word.lexem || "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h3>
            {word.lexem}
            {word.part_of_speech && (
              <span className="badge">{word.part_of_speech}</span>
            )}
          </h3>
          <p>{word.definition || "(tanpa definisi)"}</p>
        </div>
      </div>
    </Link>
  );
}
