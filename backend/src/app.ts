import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

const app = express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

app.use(errorHandler);

export default app;