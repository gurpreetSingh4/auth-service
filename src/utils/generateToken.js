import jwt from "jsonwebtoken"
import crypto from "crypto"
import { RefreshToken } from "../models/RefreshToken.js"

export const generateToken = async(user)=>{
    const payLoad = {
        userId: user._id,
        email: user.email,
        role: user.role
    }
    const accessToken = jwt.sign(
        payLoad,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
        }
    )

    const refreshToken = crypto.randomBytes(40).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate()+process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME_IN_DAYS)

    const refreshTokenDoc = new RefreshToken({
        token: refreshToken,
        user: user._id,
        expiresAt
    })
    await refreshTokenDoc.save()

    return {accessToken, refreshToken}
}