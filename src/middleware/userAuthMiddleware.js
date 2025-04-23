import { redisClient } from "../config/redis-client.js";

export const userAuthMiddleware = async (req, res, next) => {
  const user = req.query.userid
  if(!user){
    return res.status(400).json({
      success: false,
      message: "userid not found in query parameter",
    });
  }
  const token = await redisClient.get(
    `${process.env.AUTHACCESSTOKENREDIS}:${user}`
  );
  if (!token) {
    return res.status(403).json({
      success: false,
      message: "auth access token not found login again",
    });
  }
  next();
};
