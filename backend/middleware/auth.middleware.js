import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // Extract token from cookies or Authorization header
    const token =
        req.cookies?.accessToken ||
        (req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null);

    if (!token) {
        throw new ApiError(401, "Unauthorized — no access token provided");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            throw new ApiError(401, "Unauthorized — access token has expired");
        }
        throw new ApiError(401, "Unauthorized — invalid access token");
    }

    const user = await User.findById(decodedToken.id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Unauthorized — user not found");
    }

    req.user = user;
    next();
});
