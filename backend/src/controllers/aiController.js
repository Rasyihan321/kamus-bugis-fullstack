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
  "contohnya", "kalimatnya", "misalnya", "misal", "sebutkan", "berarti",
  "tentang", "boleh", "bisa", "minta", "terjemahkan", "terjemahan",
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
    // sisakan kandidat kata (mis. "contoh kalimat untuk anre" → ["anre"])
    const tokens = message
      .toLowerCase()
      .split(/[^a-zé'’-]+/i)
      .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 1) Arah Bugis → Indonesia: token persis sama dengan lema Bugis
    let entries = tokens.length
      ? await Word.find({ lexem: { $in: tokens } }).limit(6)
      : [];

    // 2) Arah Indonesia → Bugis: token adalah kata Indonesia, cari lema
    //    yang DEFINISI-nya cocok (mis. "makan" → anre, manre)
    if (!entries.length && tokens.length) {
      entries = await Word.find({
        lexem: { $ne: null },
        definition: { $in: tokens },
      }).limit(6);
      if (!entries.length) {
        for (const t of tokens) {
          entries = await Word.find({
            lexem: { $ne: null },
            definition: new RegExp(`(^|[\\s;,(])${esc(t)}([\\s;,.)]|$)`, "i"),
          })
            .sort({ definition: 1 })
            .limit(5);
          if (entries.length) break;
        }
      }
    }

    // 3) Terakhir: kecocokan awalan lema (salah ketik ringan / bentuk turunan)
    if (!entries.length) {
      for (const t of [...tokens].reverse()) {
        entries = await Word.find({ lexem: new RegExp(`^${esc(t)}`, "i") })
          .sort({ lexem: 1 })
          .limit(3);
        if (entries.length) break;
      }
    }

    // Kata Bugis acuan untuk prompt AI: lema hasil pencarian
    const word =
      entries[0]?.lexem || tokens[0] || message.toLowerCase();

    const { reply, source } = await generateExamples(message, word, entries);

    res.json({
      word,
      reply,
      source, // "ollama" (LLM) atau "kamus" (fallback lokal)
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
