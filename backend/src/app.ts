import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

app.use(
    cors({
        origin: (origin, callback) => {
            // Izinkan request tanpa origin (seperti curl, mobile app) atau localhost
            if (
                !origin ||
                origin.includes('localhost') ||
                origin.includes('127.0.0.1')
            ) {
                return callback(null, true);
            }

            // Regex mengizinkan akses dari semua rentang IP lokal WiFi (192.168.* atau 10.*)
            const isLocalNetwork =
                /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/.test(
                    origin
                );

            if (isLocalNetwork) {
                callback(null, true);
            } else {
                callback(new Error('CORS origin tidak diizinkan'));
            }
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

app.use(errorHandler);

export default app;
