import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtUtils.js";
import { sendEmail } from "../utils/nodemailer.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(401).json({
        success: false,
        message: "Please fill in all empty fields (name, email, pasword).",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User found. Cannot register an existing user.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      isAccountVerified: false,
      verificationOtp: null,
      verificationOtpExpireAt: null,
    });

    await sendEmail({
      to: user.email,
      subject: "Welcome to Slice&Stack — we are happy you are here 😊",
      html: `
    <h1>Welcome to <strong>Slice&Stack!</strong> 🎉</h1>
    <p>Hi ${user.name}</p>
    <p>Welcome to Slice&Stack! 🎉</p>
    <p style="margin-bottom:20px">We’re happy to have you join our food community.</p>
    <p>Your registration was successful, and your account is now active.</p>
    <p>You can browse our menu, select your favorite meals, and place orders</p>
    <p style="margin-bottom:20px">directly through the website.</p>
    <p>For your convenience, you can choose to pay securely online when ordering</p>
    <p style="margin-bottom:20px">or make payment at the restaurant when you arrive.</p>
    <p style="margin-bottom:20px">If you have any questions or need assistance, our support team is always here to help.</p>
    <p style="margin-bottom:20px">Thanks for joining us — we look forward to serving you!</p>
    <p>Warm regards.</p>
    <p>The Slice&Stack Team</p> 
  `,
    });

    return res.status(201).json({
      success: true,
      message: "User registration successful.",
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error when registering a user.",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "Please fill in all empty fields (email, pasword).",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const userId = user._id;

    if (user.isAccountVerified === false) {
      return res.status(403).json({
        success: false,
        message: "In order to continue please verify your account.",
        verificationOtpLink: `/send-otp/${userId}`,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: `${user.role} logged in successfully.`,
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error when logging In.",
    });
  }
};

export const dashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No user found. Please login.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error when fetching user data.",
    });
  }
};

export const regenerateAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token.",
      });
    }

    const user = await userModel.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Refresh token not recognized.",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_TOKEN);

    const newAccessToken = generateAccessToken(decoded);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 15 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      message: "Access token refreshed.",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const userRefreshToken = req.cookies.refreshToken;

    if (userRefreshToken) {
      const user = await userModel.findOne({ refreshToken: userRefreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error when logging out.",
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(401).json({
        success: false,
        message: "Please fill in all empty fields (email, pasword).",
      });
    }

    const ownerId = req.user.id;
    const owner = await userModel.findOne(ownerId);
    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "No user. Please login.",
      });
    }

    if (owner.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Not authorized. Only owners are allowed access.",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User found. Cannot register an existing user.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Admin registration successful.",
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error when creating an admin.",
    });
  }
};

export const createOwner = async () => {
  try {
    const existingOwner = await userModel.findOne({
      email: process.env.OWNER_EMAIL,
    });
    if (existingOwner) {
      console.log("Owner already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.OWNER_PASSWORD, 10);
    const newOwner = await userModel.create({
      name: process.env.OWNER_NAME,
      email: process.env.OWNER_EMAIL,
      password: hashedPassword,
      role: "owner",
      isAccountVerified: true,
      verificationOtp: null,
      verificationOtpExpireAt: null,
    });

    console.log(`Owner ${newOwner.name} has been created`);
  } catch (error) {
    console.log("Error: ", error.message);
    console.log("Internal server error when creating an owner.");
  }
};

export const sendVerificationOtp = async (req, res) => {
  try {
    const userId = req.params;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please go back to login page.",
      });
    }

    if (user.isAccountVerified === true) {
      return res.status(403).json({
        success: false,
        message: "Account verified. Please navigate to the login page.",
      });
    }

    const otp = Number(Math.floor(100000 + Math.random() * 900000));

    user.verificationOtp = otp;

    user.verificationOtpExpireAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Almost There! Verify Your Slice&Stack Account 😊",
      html: `
    <h1>Welcome back to <strong>Slice&Stack!</strong> 🎉</h1>
    <p>Hi ${user.name}</p>
    <p>We noticed you tried to log in, but your Slice&Stack account hasn't been verified yet. No worries — let's get you set up!</p>
    <p>Use the OTP below to verify your account and access all the delicious features:</p>
    <div style="margin:20px 0; padding:15px; background-color:#FFFAE6; border-radius:5px; text-align:center; font-size:24px; font-weight:bold;">
    ${otp}
    </div>
    <p>This OTP is valid for 10 minutes. Please keep it safe and do not share it with anyone.</p>
    <p>If you didn't try to log in, you can safely ignore this email.</p>
    <p>See you soon!</p>
    <p>The Slice&Stack Team</p> 
  `,
    });

    return res.status(200).json({
      success: true,
      message: "Verification otp sent to your email.",
      userId: user._id,
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Cannot generate OTP. Try again later.",
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please enter the OTP.",
      });
    }

    const userId = req.params;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please go back to login page.",
      });
    }

    if (user.isAccountVerified === true) {
      return res.status(403).json({
        success: false,
        message: "Account verified. Please navigate to the login page.",
      });
    }

    const currentTime = new Date();

    if (!user.verificationOtp || currentTime > user.verificationOtpExpireAt) {
      user.verificationOtp = null;
      user.verificationOtpExpireAt = null;
      await user.save();
      return res.status(403).json({ success: false, message: "OTP expired." });
    }

    if (user.verificationOtp !== Number(otp)) {
      return res
        .status(403)
        .json({ success: false, message: "Incorrect OTP." });
    }

    user.isAccountVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpireAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully! Navigate to login.",
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Cannot verify account. Try again later.",
    });
  }
};

export const sendResetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email.",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found. Please register.",
      });
    }

    const otp = Number(Math.floor(100000 + Math.random() * 900000));

    user.resetPasswordOtp = otp;

    user.resetPasswordOtpExpireAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Almost There! Reset Your Slice&Stack Password 😊",
      html: `
    <h1>Password Reset Request</h1>
    <p>Hi ${user.name}</p>
    <p>We received a request to reset your Slice&Stack account password. Use the OTP below to securely reset your password:</p>
    <div style="margin:20px 0; padding:15px; background-color:#FFFAE6; border-radius:5px; text-align:center; font-size:24px; font-weight:bold;">
    ${otp}
    </div>
    <p>This OTP is valid for 10 minutes. Please keep it safe and do not share it with anyone.</p>
    <p>If you didn't try to log in, you can safely ignore this email.</p>
    <p>See you soon!</p>
    <p>The Slice&Stack Team</p> 
  `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email address.",
      userId: user._id,
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message:
        "Internal server error. Cannot generate reset OTP. Try again later.",
    });
  }
};

export const validateResetPasswordOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const { userId } = req.params.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "No user found.",
      });
    }

    if (!otp) {
      return res.status(401).json({
        successs: false,
        message: "Please provide OTP.",
      });
    }

    const currentTime = new Date();

    if (!user.resetPasswordOtp || currentTime > user.resetPasswordOtpExpireAt) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpireAt = null;
      await user.save();
      return res.status(403).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (user.resetPasswordOtp !== Number(otp)) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    user.isResetPasswordOtpValid = true;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpireAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
      userId: user._id,
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Cannot valiate OTP. Try again later.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields. (password and confirm password).",
      });
    }

    const { userId } = req.params;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found.",
      });
    }

    if (user.isResetPasswordOtpValid === false) {
      return res.status(403).json({
        success: false,
        message: "Your Otp is invalid. cannot reset password.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(404).json({
        success: false,
        message: "Password and Confirm password are not the same.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Password has successfully been reset.",
    });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Cannot reset Password. Try again later.",
    });
  }
};
