"use client";

// Halaman Chat AI: pengguna mengetik kata Bugis (mis. "anre"),
// AI membalas dengan contoh kalimat + terjemahannya, dalam tampilan chat.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askAi } from "../../lib/api";

const SUGGESTIONS = ["anre", "bola", "lopi", "uwae", "magello"];

const WELCOME = {
  role: "ai",
  text:
    "Halo! 👋 Saya asisten AI Kamus Bugis.\n" +
    "Ketik sebuah kata bahasa Bugis (misalnya \"anre\" = makan), " +
    "dan saya akan buatkan contoh kalimat beserta terjemahannya.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await askAi(message);
      setMessages((m) => [
        ...m,
        { role: "ai", text: res.reply, source: res.source, matches: res.matches },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: `Maaf, terjadi kesalahan: ${e.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1>Chat AI — Contoh Kalimat 🤖</h1>
        <p>Ketik kata Bugis, AI membuatkan contoh kalimat dan terjemahannya</p>
      </section>

      <div className="chat-card">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-row ${m.role}`}>
              <div className={`chat-bubble ${m.role}${m.error ? " err" : ""}`}>
                {m.role === "ai" && <span className="chat-avatar">🤖</span>}
                <div className="chat-text">
                  {m.text}
                  {m.matches?.length > 0 && (
                    <div className="chat-links">
                      {m.matches.map((w) => (
                        <Link key={w.id} href={`/words/${w.id}`} className="chat-chip">
                          📖 {w.lexem} — {w.definition}
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.source && (
                    <div className="chat-source">
                      sumber: {m.source === "ollama" ? "AI (Ollama Unismuh)" : "data kamus"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-row ai">
              <div className="chat-bubble ai typing">
                <span className="chat-avatar">🤖</span>
                <span className="dots">
                  <i /><i /><i />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chat-chip" onClick={() => send(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            type="text"
            placeholder="Ketik kata Bugis… (mis. anre)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Kirim ➤
          </button>
        </form>
      </div>
    </>
  );
}
