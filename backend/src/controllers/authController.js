import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import {
    sendEmailVerificationOtp,
    sendPasswordResetOtp,
} from "../services/emailService.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendUserResponse = (res, statusCode, user, token, message) => {
    res.status(statusCode).json({
        success: true,
        message,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
        },
    });
};

const normalizeEmail = (email) => {
    return email?.toLowerCase().trim();
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            if (existingUser.authProvider === "google") {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email already uses Google login. Use forgot password to create a normal password.",
                });
            }

            return res.status(409).json({
                success: false,
                message: "User already exists with this email. Please login.",
            });
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            role: "customer",
            authProvider: "local",
            isEmailVerified: false,
        });

        const otp = user.createEmailVerificationOtp();
        await user.save({ validateBeforeSave: false });

        await sendEmailVerificationOtp({
            name: user.name,
            email: user.email,
            otp,
        });

        res.status(201).json({
            success: true,
            message:
                "Registration successful. Please check your email and verify your account using the OTP.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed.",
            error: error.message,
        });
    }
};

export const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        const user = await User.findOne({ email: normalizeEmail(email) }).select(
            "+emailVerificationOtp +emailVerificationOtpExpiresAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified.",
            });
        }

        if (
            !user.emailVerificationOtp ||
            !user.emailVerificationOtpExpiresAt ||
            user.emailVerificationOtpExpiresAt < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new verification OTP.",
            });
        }

        const isOtpValid = user.isOtpMatched(otp, user.emailVerificationOtp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationOtpExpiresAt = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now login.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Email verification failed.",
            error: error.message,
        });
    }
};

export const resendVerificationOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const user = await User.findOne({ email: normalizeEmail(email) });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified.",
            });
        }

        const otp = user.createEmailVerificationOtp();
        await user.save({ validateBeforeSave: false });

        await sendEmailVerificationOtp({
            name: user.name,
            email: user.email,
            otp,
        });

        res.status(200).json({
            success: true,
            message: "Verification OTP sent successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to resend verification OTP.",
            error: error.message,
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const user = await User.findOne({
            email: normalizeEmail(email),
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message:
                    "This account does not have a password yet. Use forgot password to create a password.",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been disabled.",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before login.",
            });
        }

        const isPasswordMatched = await user.matchPassword(password);

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(res, user._id);

        sendUserResponse(res, 200, user, token, "Login successful.");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed.",
            error: error.message,
        });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required.",
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const email = normalizeEmail(payload.email);
        const name = payload.name || "Google User";
        const avatar = payload.picture || "";
        const isGoogleEmailVerified = payload.email_verified;

        if (!email || !isGoogleEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Google email is not verified.",
            });
        }

        let user = await User.findOne({
            $or: [{ googleId }, { email }],
        }).select("+password");

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar,
                role: "customer",
                authProvider: "google",
                isEmailVerified: true,
            });
        } else {
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been disabled.",
                });
            }

            user.googleId = user.googleId || googleId;
            user.avatar = user.avatar || avatar;
            user.isEmailVerified = true;

            if (user.authProvider === "local") {
                user.authProvider = "both";
            }

            if (user.authProvider === "google" && user.password) {
                user.authProvider = "both";
            }

            await user.save({ validateBeforeSave: false });
        }

        const token = generateToken(res, user._id);

        sendUserResponse(res, 200, user, token, "Google login successful.");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Google login failed.",
            error: error.message,
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const user = await User.findOne({ email: normalizeEmail(email) });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email.",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been disabled.",
            });
        }

        const otp = user.createPasswordResetOtp();
        await user.save({ validateBeforeSave: false });

        await sendPasswordResetOtp({
            name: user.name,
            email: user.email,
            otp,
        });

        res.status(200).json({
            success: true,
            message: "Password reset OTP sent to your email.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send password reset OTP.",
            error: error.message,
        });
    }
};

export const verifyPasswordResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        const user = await User.findOne({ email: normalizeEmail(email) }).select(
            "+passwordResetOtp +passwordResetOtpExpiresAt +isPasswordResetOtpVerified +passwordResetOtpVerifiedUntil"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (
            !user.passwordResetOtp ||
            !user.passwordResetOtpExpiresAt ||
            user.passwordResetOtpExpiresAt < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new password reset OTP.",
            });
        }

        const isOtpValid = user.isOtpMatched(otp, user.passwordResetOtp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        user.isPasswordResetOtpVerified = true;
        user.passwordResetOtpVerifiedUntil = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "OTP verified successfully. You can now reset your password.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "OTP verification failed.",
            error: error.message,
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email and new password are required.",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const user = await User.findOne({ email: normalizeEmail(email) }).select(
            "+password +isPasswordResetOtpVerified +passwordResetOtpVerifiedUntil +passwordResetOtp +passwordResetOtpExpiresAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (
            !user.isPasswordResetOtpVerified ||
            !user.passwordResetOtpVerifiedUntil ||
            user.passwordResetOtpVerifiedUntil < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please verify your password reset OTP first.",
            });
        }

        user.password = newPassword;
        user.isEmailVerified = true;

        if (user.authProvider === "google") {
            user.authProvider = "both";
        }

        user.passwordResetOtp = undefined;
        user.passwordResetOtpExpiresAt = undefined;
        user.isPasswordResetOtpVerified = false;
        user.passwordResetOtpVerifiedUntil = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now login.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Password reset failed.",
            error: error.message,
        });
    }
};

export const logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({
        success: true,
        message: "Logout successful.",
    });
};

export const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            authProvider: req.user.authProvider,
            avatar: req.user.avatar,
            isEmailVerified: req.user.isEmailVerified,
            isActive: req.user.isActive,
        },
    });
};