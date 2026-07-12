"use client";

// Form entri kamus — dipakai bersama oleh halaman Tambah dan Edit.
import { useState } from "react";

const POS_CHOICES = ["", "n", "v", "a", "adv", "pron", "num", "p"];

export default function WordForm({ initial = {}, submitLabel, onSubmit }) {
  const [form, setForm] = useState({
    lexem: initial.lexem || "",
    definition: initial.definition || "",
    part_of_speech: initial.part_of_speech || "",
    phonetic_form: initial.phonetic_form || "",
    example: initial.example || "",
    example_gloss: initial.example_gloss || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.lexem.trim() || !form.definition.trim()) {
      setError("Kata Bugis dan artinya wajib diisi");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // String kosong dikirim sebagai null agar konsisten dengan dataset
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [
          k,
          v.trim() === "" ? null : v.trim(),
        ]),
      );
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error && <div className="alert-err">{error}</div>}

      <label>Kata Bugis (lema) *</label>
      <input
        value={form.lexem}
        onChange={set("lexem")}
        placeholder="mis. anre"
      />

      <label>Arti / definisi (bahasa Indonesia) *</label>
      <textarea
        rows={3}
        value={form.definition}
        onChange={set("definition")}
        placeholder="mis. makan"
      />

      <label>Kelas kata</label>
      <select value={form.part_of_speech} onChange={set("part_of_speech")}>
        {POS_CHOICES.map((p) => (
          <option key={p} value={p}>
            {p === "" ? "(tidak ditentukan)" : p}
          </option>
        ))}
      </select>

      <label>Bentuk fonetis</label>
      <input
        value={form.phonetic_form}
        onChange={set("phonetic_form")}
        placeholder="mis. an.re"
      />

      <label>Contoh kalimat (Bugis)</label>
      <input
        value={form.example}
        onChange={set("example")}
        placeholder="mis. anre ni mai"
      />

      <label>Terjemahan contoh</label>
      <input
        value={form.example_gloss}
        onChange={set("example_gloss")}
        placeholder="mis. silakan makan"
      />

      <div className="mt">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Menyimpan…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
