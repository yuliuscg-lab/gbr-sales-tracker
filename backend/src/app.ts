// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

// Whitelist domain resmi produksi (dan dev lokal untuk pengujian masa depan)
const allowedOrigins = [
    'https://backoffice.gembirapancing.com', // Frontend Vercel (Produksi)
    'http://localhost:5173', // Frontend lokal saat dev di laptop
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Izinkan jika tidak ada origin (seperti curl, mobile native, atau server-to-server)
            // atau origin berada di daftar allowedOrigins
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Akses ditolak oleh CORS'));
        },
        credentials: true, // Wajib bernilai true agar cookie refreshToken dapat dikirim & diterima
    })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

// Error handler wajib diletakkan di paling bawah setelah seluruh rute
app.use(errorHandler);

export default app;
