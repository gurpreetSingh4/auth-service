import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectToMongoDb = async (url) => {
    try {
        await mongoose.connect(url);
        logger.info("Connected to MongoDB");
    } catch (error) {
        logger.error("Error connecting to MongoDB", error);
    }   
}