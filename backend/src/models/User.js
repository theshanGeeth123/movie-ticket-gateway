import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "staff"],
      default: "customer",
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "both"],
      default: "local",
    },

    googleId: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: "",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    emailVerificationOtp: {
      type: String,
      select: false,
    },

    emailVerificationOtpExpiresAt: {
      type: Date,
      select: false,
    },

    passwordResetOtp: {
      type: String,
      select: false,
    },

    passwordResetOtpExpiresAt: {
      type: Date,
      select: false,
    },

    isPasswordResetOtpVerified: {
      type: Boolean,
      default: false,
      select: false,
    },

    passwordResetOtpVerifiedUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 6 digit OTP
const generateSixDigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP before saving
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// Create email verification OTP
userSchema.methods.createEmailVerificationOtp = function () {
  const otp = generateSixDigitOtp();

  this.emailVerificationOtp = hashOtp(otp);
  this.emailVerificationOtpExpiresAt = Date.now() + 10 * 60 * 1000;

  return otp;
};

// Create password reset OTP
userSchema.methods.createPasswordResetOtp = function () {
  const otp = generateSixDigitOtp();

  this.passwordResetOtp = hashOtp(otp);
  this.passwordResetOtpExpiresAt = Date.now() + 10 * 60 * 1000;
  this.isPasswordResetOtpVerified = false;
  this.passwordResetOtpVerifiedUntil = undefined;

  return otp;
};

// Check OTP
userSchema.methods.isOtpMatched = function (plainOtp, hashedOtp) {
  const otpHash = hashOtp(plainOtp);
  return otpHash === hashedOtp;
};

const User = mongoose.model("User", userSchema);

export default User;