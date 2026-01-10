import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connection state ko cache karne ke liye taake serverless function baar baar connect na kare
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error("❌ MONGO_URI missing in Environment Variables");
      return;
    }

    const db = await mongoose.connect(mongoURI);
    
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    // Vercel par process.exit nahi karte, warna function foran die ho jayega
  }
};

export default connectDB;