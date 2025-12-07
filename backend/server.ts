import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import parkingRoutes from './routes/parking';
import qrRoutes from './routes/qr';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/parking', parkingRoutes);
app.use('/api/qr', qrRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ParkChain backend is running' });
});

app.listen(PORT, () => {
  console.log(`ParkChain backend server running on port ${PORT}`);
});

export default app;
