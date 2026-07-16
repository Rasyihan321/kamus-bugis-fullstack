// Controller fitur AI: pembuatan contoh kalimat bahasa Bugis (chat).
const Word = require("../models/Word");
const { generateExamples } = require("../services/aiService");

// Kata umum bahasa Indonesia yang diabaikan saat mencari kata Bugis di pesan
const STOPWORDS = new Set([
  "contoh", "kalimat", "untuk", "kata", "buatkan", "buat", "bikin", "tolong",
  "arti", "artinya", "apa", "itu", "ini", "dari", "yang", "dengan", "dan",
  "dalam", "bahasa", "bugis", "indonesia", "dong", "ya", "kak", "min",
  "berikan", "beri", "kasih", "coba", "mau", "saya", "aku", "gimana",
  "bagaimana", "adalah", "ke", "di", "pakai", "pake", "ai", "halo", "hai",
]);

// POST /api/ai/chat — terima pesan chat, balas dengan contoh kalimat AI
exports.chat = async (req, res, next) => {
  try {
    const message = (req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Field 'message' wajib diisi" });
    }
    if (message.length > 300) {
      return res
        .status(400)
        .json({ message: "Pesan terlalu panjang (maks. 300 karakter)" });
    }

    // Tokenisasi pesan: buang tanda baca & stopword Indonesia,
    // sisakan kandidat kata Bugis (mis. "contoh kalimat untuk anre" → ["anre"])
    const tokens = message
      .toLowerCase()
      .split(/[^a-zé'’-]+/i)
      .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

    // Cari entri kamus yang lexem-nya persis salah satu token
    let entries = tokens.length
      ? await Word.find({ lexem: { $in: tokens } }).limit(6)
      : [];

    // Jika tak ada yang persis, coba prefix pada token terakhir → pertama
    let word = entries[0]?.lexem || null;
    if (!entries.length) {
      for (const t of [...tokens].reverse()) {
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        entries = await Word.find({ lexem: new RegExp(`^${escaped}`, "i") })
          .sort({ lexem: 1 })
          .limit(3);
        if (entries.length) {
          word = t;
          break;
        }
      }
    }
    if (!word) word = tokens[0] || message.toLowerCase();

    const { reply, source } = await generateExamples(message, word, entries);

    res.json({
      word,
      reply,
      source, // "gemini" (LLM) atau "kamus" (fallback lokal)
      matches: entries.map((e) => ({
        id: e.id,
        lexem: e.lexem,
        definition: e.definition,
        part_of_speech: e.part_of_speech,
      })),
    });
  } catch (err) {
    next(err);
  }
};
