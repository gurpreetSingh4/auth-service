import {RateLimiterRedis} from "rate-limiter-flexible"
import {rateLimit} from "express-rate-limit"
import {RedisStore} from "rate-limit-redis"
import { logger } from "../utils/logger.js"
import { redisClient } from "../config/redis-client.js"


export const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1, // per 1 second by IP
})

export const sensitiveEndpointsRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minute
    max: 10, // limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Too many requests from IP: ${
            req.ip
        }`)
        res.status(429).json({
            success: false,
            message: 'Too many requests'
        })
    },
    store: new RedisStore({
        sendCommand:(...args)=> redisClient.call(...args)
    })
})