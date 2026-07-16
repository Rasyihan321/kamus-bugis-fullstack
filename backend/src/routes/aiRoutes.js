// Rute fitur AI (contoh kalimat / chat) + anotasi Swagger.
const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

/**
 * @openapi
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Chat AI — buat contoh kalimat bahasa Bugis untuk sebuah kata
 *     description: >
 *       Kirim sebuah kata Bugis (mis. "anre") atau kalimat permintaan,
 *       AI membalas dengan contoh kalimat beserta terjemahannya.
 *       Menggunakan LLM di server Ollama (URL dikonfigurasi via env);
 *       jika server tak terjangkau, jawaban dirakit dari data kamus MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: anre
 *     responses:
 *       200:
 *         description: Balasan AI berisi contoh kalimat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 word: { type: string, example: anre }
 *                 reply: { type: string }
 *                 source: { type: string, enum: [ollama, kamus] }
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       lexem: { type: string }
 *                       definition: { type: string }
 *                       part_of_speech: { type: string }
 *       400: { description: Pesan kosong atau terlalu panjang }
 */
router.post("/ai/chat", aiController.chat);

module.exports = router;
