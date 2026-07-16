"use client";

// Panel AI di halaman detail kata: membuat contoh kalimat untuk
// lema yang sedang dibuka (memakai endpoint /api/ai/chat).
import { useState } from "react";
import Link from "next/link";
import { askAi } from "../lib/api";

export default function AiExamples({ lexem }) {
  const [reply, setReply] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await askAi(`contoh kalimat ${lexem}`);
      setReply(res.reply);
      setSource(res.source);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <h3>🤖 Contoh Kalimat AI</h3>
        <Link href="/chat" className="chat-chip">
          Buka Chat AI →
        </Link>
      </div>
      <p className="muted ai-panel-desc">
        Minta AI membuatkan contoh kalimat bahasa Bugis untuk kata{" "}
        <b>“{lexem}”</b> beserta terjemahannya.
      </p>

      {!reply && !loading && (
        <button className="btn btn-primary" onClick={generate}>
          ✨ Buatkan contoh kalimat
        </button>
      )}

      {loading && (
        <div className="ai-panel-loading">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="muted">AI sedang menyusun contoh kalimat…</span>
        </div>
      )}

      {error && <div className="alert-err">Gagal: {error}</div>}

      {reply && !loading && (
        <>
          <div className="ai-panel-reply">{reply}</div>
          <div className="row mt">
            <span className="chat-source">
              sumber: {source === "ollama" ? "AI (Ollama Unismuh)" : "data kamus"}
            </span>
            <button
              className="btn btn-outline"
              onClick={generate}
              disabled={loading}
            >
              🔄 Buat ulang
            </button>
          </div>
        </>
      )}
    </div>
  );
}
