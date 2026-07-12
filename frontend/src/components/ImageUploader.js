"use client";

// Komponen upload gambar ilustrasi kata.
// File dikirim multipart ke backend, lalu backend menyimpannya ke MinIO.
import { useRef, useState } from "react";
import { uploadImage } from "../lib/api";

export default function ImageUploader({ wordId, hasImage, onUploaded }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await uploadImage(wordId, file);
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mt">
      <label className="btn btn-primary" style={{ cursor: "pointer" }}>
        {busy
          ? "Mengunggah…"
          : hasImage
            ? "🖼 Ganti Gambar (MinIO)"
            : "🖼 Upload Gambar (MinIO)"}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleChange}
          disabled={busy}
        />
      </label>
      {error && <div className="alert-err">{error}</div>}
    </div>
  );
}
