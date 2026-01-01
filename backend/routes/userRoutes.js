import express from "express";
import {
  createAdmin,
  dashboard,
  fetchAdmins,
  loginUser,
  logoutUser,
  regenerateAccessToken,
  registerUser,
  resetPassword,
  sendResetPasswordOtp,
  sendVerificationOtp,
  uploadProfilePicture,
  validateResetPasswordOtp,
  verifyAccount,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/userAuth.js";
import { upload } from "../utils/multer.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/user-dashboard", authMiddleware, dashboard);
userRouter.post("/refresh", regenerateAccessToken);
userRouter.post("/logout", logoutUser);
userRouter.post("/create-admin", authMiddleware, createAdmin);
userRouter.post("/send-verification-otp/:id", sendVerificationOtp);
userRouter.post("/verify-account/:id", verifyAccount);
userRouter.post("/send-reset-otp", sendResetPasswordOtp);
userRouter.post("/validate-reset-otp/:id", validateResetPasswordOtp);
userRouter.post("/reset-password/:id", resetPassword);
userRouter.post(
  "/upload-profile-picture",
  authMiddleware,
  upload.single("image"),
  uploadProfilePicture
);
userRouter.get("/host-dashboard", authMiddleware, fetchAdmins);

export default userRouter;
