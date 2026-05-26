import User from "../models/userModel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { COOKIE_OPTIONS } from "../config/constants.js";
import jwt from "jsonwebtoken";

// Helper: generate access + refresh tokens and save refresh token to DB
const generateTokens = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// ─── REGISTER ────────────────────────────────────────────────
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required (name, email, password)");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Create user (password is auto-hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    // Fetch created user without sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

// ─── LOGIN ───────────────────────────────────────────────────
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Get user without sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken
            }, "Login successful")
        );
});

// ─── LOGOUT ──────────────────────────────────────────────────
export const logoutUser = asyncHandler(async (req, res) => {
    // Remove refresh token from DB
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", COOKIE_OPTIONS)
        .clearCookie("refreshToken", COOKIE_OPTIONS)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── REFRESH ACCESS TOKEN ────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken.id).select("+refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid refresh token — user not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token has been used or is expired");
    }

    // Generate new token pair
    const { accessToken, refreshToken } = await generateTokens(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
        .json(
            new ApiResponse(200, { accessToken }, "Access token refreshed successfully")
        );
});

// ─── GET CURRENT USER ────────────────────────────────────────
export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    );
});

// ─── UPDATE PROFILE ──────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, email, avatar } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (avatar !== undefined) updateFields.avatar = avatar;

    if (email && email.toLowerCase() !== req.user.email) {
        // Check if new email is already taken
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            throw new ApiError(409, "Email is already in use by another account");
        }
        updateFields.email = email.toLowerCase();
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters");
    }

    const user = await User.findById(req.user._id).select("+password");

    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError(400, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash the new password

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );
});
