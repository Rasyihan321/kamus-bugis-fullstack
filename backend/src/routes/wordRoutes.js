// Definisi rute REST API untuk entri kamus + anotasi Swagger (OpenAPI 3).
const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');
const imageController = require('../controllers/imageController');
const { upload } = require('../middleware/upload');

/**
 * @openapi
 * components:
 *   schemas:
 *     Word:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Identifier unik entri kamus
 *         lexem:
 *           type: string
 *           nullable: true
 *           description: Kata/lema dalam bahasa Bugis
 *           example: anre
 *         related_words_id:
 *           type: string
 *           nullable: true
 *           description: Id entri induk (untuk makna turunan)
 *         part_of_speech:
 *           type: string
 *           nullable: true
 *           description: Kelas kata (n, v, a, adv, pron, num, p, ...)
 *           example: v
 *         phonetic_form:
 *           type: string
 *           nullable: true
 *         sense_number:
 *           type: integer
 *           nullable: true
 *         definition:
 *           type: string
 *           description: Arti kata dalam bahasa Indonesia
 *           example: makan
 *         example:
 *           type: string
 *           nullable: true
 *           description: Contoh kalimat bahasa Bugis
 *         example_gloss:
 *           type: string
 *           nullable: true
 *           description: Terjemahan contoh kalimat
 *         image:
 *           type: object
 *           nullable: true
 *           description: Metadata gambar ilustrasi yang tersimpan di MinIO
 *           properties:
 *             objectName: { type: string }
 *             originalName: { type: string }
 *             mimeType: { type: string }
 *             size: { type: integer }
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: URL untuk mengambil gambar via API
 *     WordInput:
 *       type: object
 *       required: [lexem, definition]
 *       properties:
 *         lexem: { type: string, example: anre }
 *         definition: { type: string, example: makan }
 *         part_of_speech: { type: string, example: v }
 *         phonetic_form: { type: string, example: "an.re" }
 *         example: { type: string, example: "anre ni mai" }
 *         example_gloss: { type: string, example: "silakan makan" }
 */

/**
 * @openapi
 * /api/words:
 *   get:
 *     tags: [Words]
 *     summary: Daftar entri kamus (pencarian + pagination)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari pada lema atau definisi
 *       - in: query
 *         name: pos
 *         schema: { type: string }
 *         description: Filter kelas kata (n, v, a, dst.)
 *       - in: query
 *         name: mainOnly
 *         schema: { type: boolean }
 *         description: Hanya entri utama (lexem tidak null)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Daftar entri kamus
 *   post:
 *     tags: [Words]
 *     summary: Tambah entri kamus baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WordInput'
 *     responses:
 *       201: { description: Entri berhasil dibuat }
 *       400: { description: Input tidak valid }
 */
router.get('/words', wordController.listWords);
router.post('/words', wordController.createWord);

/**
 * @openapi
 * /api/words/stats:
 *   get:
 *     tags: [Words]
 *     summary: Statistik kamus (jumlah entri, distribusi kelas kata)
 *     responses:
 *       200: { description: Statistik kamus }
 */
router.get('/words/stats', wordController.getStats);

/**
 * @openapi
 * /api/words/{id}:
 *   get:
 *     tags: [Words]
 *     summary: Detail satu entri + makna turunannya
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Detail entri kamus }
 *       404: { description: Kata tidak ditemukan }
 *   put:
 *     tags: [Words]
 *     summary: Perbarui entri kamus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WordInput'
 *     responses:
 *       200: { description: Entri berhasil diperbarui }
 *       404: { description: Kata tidak ditemukan }
 *   delete:
 *     tags: [Words]
 *     summary: Hapus entri kamus (beserta gambar di MinIO)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Entri berhasil dihapus }
 *       404: { description: Kata tidak ditemukan }
 */
router.get('/words/:id', wordController.getWord);
router.put('/words/:id', wordController.updateWord);
router.delete('/words/:id', wordController.deleteWord);

/**
 * @openapi
 * /api/words/{id}/image:
 *   post:
 *     tags: [Images]
 *     summary: Upload gambar ilustrasi kata (disimpan di MinIO)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201: { description: Gambar berhasil diunggah ke MinIO }
 *       400: { description: File tidak valid }
 *       404: { description: Kata tidak ditemukan }
 *   delete:
 *     tags: [Images]
 *     summary: Hapus gambar ilustrasi kata dari MinIO
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Gambar berhasil dihapus }
 *       404: { description: Kata/gambar tidak ditemukan }
 */
router.post('/words/:id/image', upload.single('image'), imageController.uploadImage);
router.delete('/words/:id/image', imageController.deleteImage);

/**
 * @openapi
 * /api/images/{objectName}:
 *   get:
 *     tags: [Images]
 *     summary: Ambil file gambar (di-stream langsung dari MinIO)
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File gambar
 *         content:
 *           image/*:
 *             schema: { type: string, format: binary }
 *       404: { description: Gambar tidak ditemukan }
 */
router.get('/images/:objectName', imageController.getImage);

module.exports = router;
