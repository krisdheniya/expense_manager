import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // If it's not an ApiError instance, wrap it
    if (!(error instanceof ApiError)) {
        // Mongoose validation error
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            error = new ApiError(400, "Validation failed", messages);
        }
        // Mongoose cast error (invalid ObjectId)
        else if (err.name === "CastError") {
            error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
        }
        // MongoDB duplicate key error
        else if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            error = new ApiError(409, `Duplicate value for field: ${field}`);
        }
        // JWT errors
        else if (err.name === "JsonWebTokenError") {
            error = new ApiError(401, "Invalid token");
        }
        else if (err.name === "TokenExpiredError") {
            error = new ApiError(401, "Token has expired");
        }
        // Generic fallback
        else {
            error = new ApiError(500, err.message || "Internal Server Error");
        }
    }

    // Log error in development
    if (process.env.NODE_ENV !== "production") {
        console.error("Error:", {
            statusCode: error.statusCode,
            message: error.message,
            stack: err.stack
        });
    }

    res.status(error.statusCode).json({
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
};

export { errorHandler };
