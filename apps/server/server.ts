import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from "./modules/auth/auth.routes.js";
import questionBankRoutes from "./modules/questionBank/questionBank.routes.js";
=======
import slotRoutes from "./modules/slot/slot.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js"
import eventTypeRoutes from "./modules/eventType/eventType.routes.js"
import { notFound, errorMiddleware } from './core/middlewares/error.middleware.js';
import { pool } from "./config/db.js"

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({limit: '10kb'}));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/question-banks", questionBankRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/event-types", eventTypeRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use(notFound);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const serverConnect = async()=>{
  try{
    await pool.query("SELECT 1");
    console.log("DB connected successfully")
  }catch(error){
    console.log("db connection failed",error)
    process.exit(1)
  }
  app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
};

serverConnect();