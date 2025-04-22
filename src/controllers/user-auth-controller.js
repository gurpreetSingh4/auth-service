import { redisClient } from "../config/redis-client.js";
import { User } from "../models/user.js";
import { generateJwtToken, refreshAuthToken } from "../utils/generateToken.js";
import { logger } from "../utils/logger.js";
import { validateLogin, validateRegisteration } from "../utils/validation.js";
import jwt from "jsonwebtoken"


export const registerUser = async (req, res) => {
  logger.info("Register user end point hit...");
  try {
    const { error } = validateRegisteration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    const newUser = new User({
      name,
      email,
      password,
    });
    await newUser.save();
    logger.info("User registered successfully", newUser._id);
    res.status(201).json({
      success: true,
      message: "User registered Successfully",
      id: newUser._id,
      fullName: newUser.name,
      email: newUser.email,
      profilePic : newUser.profilePicture,
    });
  } catch (error) {
    logger.error("Error registering user", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const loginUser = async (req, res) => {
  logger.info("Login user end point hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }
    const jwtAccessToken = generateJwtToken(user);
    await redisClient.set(
      `${process.env.AUTHACCESSTOKENREDIS}:${user._id}`,
      jwtAccessToken,
      "EX",
      3599 // 1 hour
    );
    user.password = undefined; // Remove password from user object
    req.user = user // Store user in request object for later use

    const refreshTokenInterval = setInterval(async()=>{
      try{
        const refreshToken = await refreshAuthToken(user);
        if(!refreshToken){
          logger.warn("Token not found in Redis");
          clearInterval(refreshTokenInterval); // Stop the interval if token is not found
        } else {
          logger.info("Token refreshed successfully");
        }
      } catch(error){
        logger.error("Error refreshing token", error)
      }
    }, 55 * 60 * 1000) // 55 minutes

    logger.info("User logged in successfully", user._id);
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      id: user._id,
      fullName: user.name,
      email: user.email,
      profilePic : user.profilePicture,
    });

  } catch (error) {
    logger.error("Error logging in user", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export async function logoutUser(req, res) {
  logger.info("Logout user endpoint hit...");
  
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request body",
      });
    }

    const tokenKey = `${process.env.AUTHACCESSTOKENREDIS}:${userId}`;
    const jwtAccessToken = await redisClient.get(tokenKey);
    if (!jwtAccessToken) {
      logger.warn("Token not found in Redis");
      return res.status(401).json({
        success: false,
        message: "Token not found in Redis, already blacklisted or user already logged out",
      });
    }

    const decoded = jwt.verify(jwtAccessToken, process.env.JWT_SECRET);
  
    const { email, exp } = decoded;

    const expiresIn = exp - Math.floor(Date.now() / 1000);

    if (expiresIn > 0) {
      // Blacklist token until it naturally expires
      await redisClient.set(`blacklist:${jwtAccessToken}`, 'true', 'EX', expiresIn);
      logger.info("Token blacklisted until expiration.");
    } else {
      logger.info("Token already expired.");
    }

    // Remove token reference from Redis
    await redisClient.del(tokenKey);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
      id: userId,
      email,
    });

  } catch (error) {
    logger.error("Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}





