import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, 
    unique: true 
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "worker"],  // allowed roles
    required: true
  },
  // ===== 2FA OTP FIELDS =====
  otp: {
    type: Number,       // 6-digit OTP
    default: null
  },
  otpExpires: {
    type: Date,         // OTP expiration time
    default: null
  }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);
