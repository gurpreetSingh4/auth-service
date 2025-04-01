import { RefreshToken } from "../models/RefreshToken.js"
import { User } from "../models/user.js"
import { generateToken } from "../utils/generateToken.js"
import { logger } from "../utils/logger.js"
import { validateLogin, validateRegisteration } from "../utils/validation.js"

export const registerUser = async (req, res) => {
    logger.info("Register user end point hit...")
    try{
        const {error} = validateRegisteration(req.body)
        if(error){
            logger.warn("Validation error", error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const{email, password, name} = req.body;
        
        const user = await User.findOne({email})
        if(user){
            logger.warn("User already exists")
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }
        const newUser = new User({
            name,
            email,
            password
        })
        await newUser.save()
        logger.info("User registered successfully", newUser._id)

        res.status(201).json({
            success: true, 
            message: "User registered Successfully",
            userId: newUser._id
        })
    }
    catch(error){
        logger.error("Error registering user", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const loginUser = async (req, res) => {
    logger.info("Login user end point hit...")
    try{
        const {error} = validateLogin(req.body)
        if(error){
            logger.warn("Validation error", error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const {username, password} = req.body;
        const user = await User.findOne({ username })
        if(!user){
            logger.warn("User not found")
            return res.status(401).json({
                success: false,
                message: "Invalid username"
            })
        }
        const isValidPassword = await user.comparePassword(password)
        if(!isValidPassword){
            logger.warn("Invalid password")
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            })
        }
        const { accessToken, refreshToken } = await generateToken(user)
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            accessToken,
            refreshToken,
            userId: user._id
        })
    }
    catch(error){
        logger.error("Error logging in user", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token end point hit...")
    try{
        const { refreshToken } = req.body;
        if(!refreshToken){
            logger.warn("Refresh token not provided")
            return res.status(400).json({
                success: false,
                message: "Refresh token not provided"
            })
        }
        const storedToken = await RefreshToken.findOne({ token: refreshToken })
        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn("Invalid refresh token")
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            })
        }
        const user = await User.findById(storedToken.user)
        if(!user){
            logger.warn("User not found")
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user)
        await RefreshToken.deleteOne({ _id: storedToken._id})
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    }
    catch(error){
        logger.error("Error refreshing token", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const logoutUser = async (req, res)=>{
    logger.info("Logout user end point hit...")
    try{
        const { refreshToken } = req.body;
        if(!refreshToken){
            logger.warn("Refresh token not provided")
            return res.status(400).json({
                success: false,
                message: "Refresh token not provided"
            })
        }
        const storedToken = await RefreshToken.findOne({ token: refreshToken })
        if(!storedToken){
            logger.warn("Invalid refresh token")
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            })
        }
        await RefreshToken.deleteOne({ _id: storedToken._id})
        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        })
    }
    catch(error){
        logger.error("Error logging out user", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}