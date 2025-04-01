import express from "express";
import { loginUser, logoutUser, refreshTokenUser, registerUser } from "../controllers/user-auth-controller.js";
import { finalizeOAuth, getGoogleOAuthUrl } from "../controllers/oAuth-controller.js";

export const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/refresh-token", refreshTokenUser)

router.get("/google", (req, res)=> {
    res.redirect(getGoogleOAuthUrl())
})
router.get("/google/callback", finalizeOAuth)

// refresh token pending    try using crone as per production standards