import mongoose from 'mongoose';
import dotenv from "dotenv"
dotenv.config();

const dbUri = process.env.DB_URI;
const dbSsl = process.env.DB_SSL === 'true';

if (!dbUri) {
  console.error("DB_URI is not defined in the environment variables!");
  process.exit(1);
}

mongoose
  .connect(dbUri, { ssl: dbSsl })
  .then(() => console.log("MongoDB connected !"))
  .catch(() => console.log("Error with MongoDB connection"));