import express from "express";
import { loginUser, logoutUser, refreshTokenUser, registerUser } from "../controllers/user-auth-controller.js";

export const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/refresh-token", refreshTokenUser)

