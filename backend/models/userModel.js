import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
  email: { type: String, unique: true, required: true },
});

const userModel = mongoose.models.User || mongoose.model("user", userSchema);

export default userModel;
