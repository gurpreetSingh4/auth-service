import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { logger } from "./utils/logger.js";
import { connectToMongoDb } from "./database/mongoDb.js";
import { rateLimiter, sensitiveEndpointsRateLimiter } from "./middleware/rateLimiter.js";
import { router } from "./routes/auth-routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config({
    path: './.env'
});

const app = express();
const port = process.env.PORT || 3001;

await connectToMongoDb(process.env.MONGODB_URI)

// middleware
app.use(express.json());
app.use(cors())
app.use(helmet())

app.use((req, res, next)=> {
    logger.info(`Received request: ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
    .then(() => {
        next();
    })
    .catch(() => {
        logger.warn(`Too many requests from IP: ${req.ip}`);
        res.status(429).json({
            success: false, 
            message: 'Too many requests'
        });
    })
})

app.use('api/auth/register', sensitiveEndpointsRateLimiter)

// routes
app.use("/api/auth", router)

// error handler
app.use(errorHandler)

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

//unhandled promise rejection -> Promise is rejected but not caught
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});