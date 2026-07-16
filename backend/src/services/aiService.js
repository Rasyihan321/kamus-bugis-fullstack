// Layanan AI pembuat contoh kalimat bahasa Bugis.
//
// Dua mode kerja:
//   1. Ollama — contoh kalimat dibuat oleh LLM di server Ollama kampus
//      (***URL-DISENSOR***) dengan konteks entri kamus MongoDB.
//   2. Fallback lokal — jika server Ollama tak terjangkau/error, jawaban
//      dirakit dari data kamus (contoh asli dataset + kalimat pola),
//      sehingga fitur tetap berfungsi tanpa layanan eksternal.
const { ollama } = require("../config/env");

const POS_LABEL = {
  n: "nomina",
  v: "verba",
  a: "adjektiva",
  adv: "adverbia",
  pron: "pronomina",
  num: "numeralia",
  p: "partikel",
};

// Susun ringkasan entri kamus sebagai konteks prompt / jawaban fallback
function describeEntries(entries) {
  return entries
    .map((e, i) => {
      const parts = [
        `${i + 1}. "${e.lexem}"${e.part_of_speech ? ` (${POS_LABEL[e.part_of_speech] || e.part_of_speech})` : ""} = ${e.definition || "-"}`,
      ];
      if (e.example)
        parts.push(
          `   contoh kamus: "${e.example}"${e.example_gloss ? ` → "${e.example_gloss}"` : ""}`,
        );
      return parts.join("\n");
    })
    .join("\n");
}

// ---------- Mode 1: Ollama (LLM kampus) ----------
async function generateWithOllama(message, word, entries) {
  const context = entries.length
    ? `Data kamus Bugis–Indonesia yang relevan:\n${describeEntries(entries)}`
    : `Tidak ada entri kamus yang cocok untuk pesan ini. Jika kamu mengenal katanya sebagai kata bahasa Bugis, tetap bantu; jika tidak, katakan dengan jujur.`;

  const system = [
    "Kamu adalah asisten AI Kamus Bahasa Bugis–Indonesia yang ramah.",
    "Tugas utamamu: membantu pengguna memahami kata bahasa Bugis dan membuat contoh kalimat bahasa Bugis beserta terjemahan bahasa Indonesianya.",
    "Gunakan data kamus yang diberikan sebagai sumber utama arti kata — jangan mengarang arti yang bertentangan dengan kamus.",
    `Jika pengguna meminta contoh kalimat, buat 3 contoh kalimat bahasa Bugis yang natural (gunakan kata "${word}" bila relevan), format daftar bernomor: kalimat Bugis, lalu terjemahan Indonesia di baris berikutnya dengan awalan '→'.`,
    "Jika pesan berupa pertanyaan lain seputar bahasa Bugis, jawab langsung dengan singkat.",
    "Jawab dalam bahasa Indonesia, ramah tapi tanpa basa-basi panjang. Jangan gunakan format markdown tebal/miring.",
    context,
  ].join("\n\n");

  // Batasi waktu tunggu agar UI tidak menggantung terlalu lama
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ollama.timeoutMs);

  try {
    const res = await fetch(`${ollama.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: ollama.model,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
        options: { temperature: 0.7, num_predict: 512 },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Ollama API ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.message?.content?.trim();
    if (!text) throw new Error("Ollama tidak mengembalikan teks");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Mode 2: Fallback berbasis data kamus ----------

// Pola kalimat sederhana per kelas kata: [kalimat Bugis, terjemahan]
function templateSentences(entry) {
  const w = entry.lexem;
  const arti = (entry.definition || "").split(/[;,]/)[0].trim();
  switch (entry.part_of_speech) {
    case "v":
      return [
        [`Maéloka ${w}.`, `Saya mau ${arti}.`],
        [`${w} ni mai!`, `Ayo ${arti}!`],
        [`Purani ${w} indo'ku.`, `Ibuku sudah ${arti}.`],
      ];
    case "n":
      return [
        [`Engka ${w} ri bolaé.`, `Ada ${arti} di rumah.`],
        [`Magello ladde' iaro ${w}-é.`, `${capitalize(arti)} itu bagus sekali.`],
        [`Melliki ${w} ri pasaé.`, `Kami membeli ${arti} di pasar.`],
      ];
    case "a":
      return [
        [`${capitalize(w)} ladde' iaé.`, `Ini ${arti} sekali.`],
        [`Dé' na ${w} bolana.`, `Rumahnya tidak ${arti}.`],
        [`${capitalize(w)} atinna.`, `Hatinya ${arti}.`],
      ];
    default:
      return [
        [`Iaé riaseng "${w}".`, `Ini disebut "${arti || w}".`],
        [`Aja' mumasala, "${w}" bettuanna "${arti || "-"}".`, `Jangan bingung, "${w}" artinya "${arti || "-"}".`],
      ];
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function generateFallback(word, entries) {
  if (!entries.length) {
    return [
      `Maaf, kata "${word}" belum ada di kamus. 🙏`,
      "Coba periksa ejaannya, atau cari kata lain — misalnya: anre (makan), bola (rumah), lopi (perahu).",
    ].join("\n");
  }

  const lines = [`Berikut informasi dan contoh kalimat untuk "${word}":`, ""];

  entries.slice(0, 3).forEach((e) => {
    lines.push(
      `📖 ${e.lexem}${e.part_of_speech ? ` (${POS_LABEL[e.part_of_speech] || e.part_of_speech})` : ""} = ${e.definition || "-"}`,
    );

    let n = 1;
    // Contoh asli dari dataset kamus lebih diutamakan
    if (e.example) {
      lines.push(`${n}. ${e.example}`);
      if (e.example_gloss) lines.push(`   → ${e.example_gloss}`);
      n++;
    }
    for (const [bugis, indo] of templateSentences(e)) {
      if (n > 3) break;
      lines.push(`${n}. ${bugis}`);
      lines.push(`   → ${indo}`);
      n++;
    }
    lines.push("");
  });

  lines.push(
    "💡 Contoh di atas dibuat otomatis dari data kamus (server AI sedang tidak terjangkau).",
  );
  return lines.join("\n").trim();
}

// ---------- API publik service ----------
// Mengembalikan { reply, source } — source: "ollama" | "kamus"
async function generateExamples(message, word, entries) {
  if (ollama.enabled) {
    try {
      return {
        reply: await generateWithOllama(message, word, entries),
        source: "ollama",
      };
    } catch (err) {
      console.error("[aiService] Ollama gagal, pakai fallback:", err.message);
    }
  }
  return { reply: generateFallback(word, entries), source: "kamus" };
}

module.exports = { generateExamples };
