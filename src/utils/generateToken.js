import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
export function generateJwtToken(user){
  const payLoad = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  const jwtAccessToken = jwt.sign(payLoad, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  });
  return jwtAccessToken;
};


export async function refreshAuthToken(user) {
  logger.info("Refresh token end point hit...");
  try {
    const getJwtAccessToken = await redisClient.get(
      `${process.env.AUTHACCESSTOKENREDIS}:${user._id}`
    );
    if (!getJwtAccessToken) {
      logger.warn("Token not found in Redis");
      return false
    }
    const newJwtAccessToken = generateJwtToken(user);
    await redisClient.set(
      `${process.env.AUTHACCESSTOKENREDIS}:${user._id}`,
      newJwtAccessToken,
      "EX",
      3599 // 1 hour
    );
    return true;
  } catch (error) {
    logger.error("Error refreshing token", error);
  }
}