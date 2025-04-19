import Redis from "ioredis";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();
export const redisClient = new Redis(process.env.REDIS_HOST).on("error", (error) => {
  logger.error(error);
});
// export const redisClient = new Redis({
//     port: process.env.REDIS_PORT,
//     host: process.env.REDIS_HOST,
//     username: process.env.REDIS_USERNAME,
//     password: process.env.REDIS_PASSWORD,
// }).on('error', (error) => {
//     logger.error(error);
// })

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}
