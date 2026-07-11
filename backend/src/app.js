// Perakitan aplikasi Express: middleware umum, Swagger UI, dan rute API.
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const wordRoutes = require('./routes/wordRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors()); // izinkan akses dari frontend (Next.js)
app.use(express.json());
app.use(morgan('dev'));

// Health check (dipakai docker-compose healthcheck)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Dokumentasi Swagger UI di /api-docs + spesifikasi mentah di /api-docs.json
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Seluruh rute REST API
app.use('/api', wordRoutes);

// Root: arahkan ke dokumentasi
app.get('/', (req, res) => res.redirect('/api-docs'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
