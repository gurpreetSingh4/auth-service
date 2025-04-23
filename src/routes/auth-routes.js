import express from "express";
import { loginUser, logoutUser, registerUser, userInfo, userRegEmails } from "../controllers/user-auth-controller.js";
import { finalizeOAuth, getGoogleOAuthUrl  } from "../controllers/oAuth-controller.js";

export const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.get("/userinfo", userInfo)
router.get("/userregemails", userRegEmails)


// logout call is mandatory for all the services to be logged out

router.get("/google", (req, res)=> {
    res.redirect(getGoogleOAuthUrl())
})
router.get("/google/callback", finalizeOAuth)

// refresh token pending    try using crone as per production standards