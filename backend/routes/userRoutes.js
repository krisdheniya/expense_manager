import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateProfile,
    changePassword
} from "../controllers/userController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Protected routes (require authentication)
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/update-profile", verifyJWT, updateProfile);
router.patch("/change-password", verifyJWT, changePassword);

export default router;
