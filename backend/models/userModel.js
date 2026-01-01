import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ["user", "admin", "owner"], default: "user" },
  isAccountVerified: { type: Boolean, default: false },
  verificationOtp: { type: Number, default: null },
  verificationOtpExpireAt: { type: Date, default: null },
  resetPasswordOtp: { type: Number, default: null },
  isResetPasswordOtpValid: { type: Boolean, default: false },
  resetPasswordOtpExpireAt: { type: Date, default: null },
  profilePicture: {
    url: String,
    public_id: String,
  },
});

const userModel = mongoose.models.User || mongoose.model("user", userSchema);

export default userModel;
