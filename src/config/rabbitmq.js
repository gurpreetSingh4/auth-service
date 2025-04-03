import amqp from "amqplib";
import {logger} from "./utils/logger.js"
import dotenv from "dotenv"

dotenv.config()

let connection = null;
let rabbitMqChannel = null;

async function connectToRabbitMQ() {
    try {
        if (!connection) {
            connection = await amqp.connect(process.env.RABBITMQ_URL);
            connection.on("close", () => {
                logger.warn("RabbitMQ connection closed. Reconnecting...");
                connection = null;
                rabbitMqChannel = null;
            });
        }

        if (!rabbitMqChannel) {
            rabbitMqChannel = await connection.createChannel();
            logger.info("Connected to RabbitMQ");
        }
        return rabbitMqChannel;
    } catch (error) {
        logger.error("RabbitMQ Connection Error:", error);
        connection = null;
        rabbitMqChannel = null;
    }
}

async function tempQueue(queueName='') {
    try {
        const channel = await connectToRabbitMQ();
        const tempQueue = await channel.assertQueue(queueName, { exclusive: true });
        logger.info(`Temporary Queue ${queueName} created`);
        return tempQueue.queue;
    } catch (error) {
        logger.error("Error creating temporary queue:", error);
    }
}

async function assertExchange(exchangeName, exchangeType) {
    try{
        const channel = await connectToRabbitMQ()
        await channel.assertExchange(exchangeName, exchangeType, { durable: true });
        logger.info(`Exchange ${exchangeName} created or already exists`);
    } catch(error){
        logger.error("Error asserting exchange:", error);
    }
}

async function assertQueue(queueName) {
    try{
        const channel = await connectToRabbitMQ()
        await channel.assertQueue(queueName, { durable: true });
        logger.info(`Queue ${queueName} created or already exists`);
    } catch(error){
        logger.error("Error asserting queue:", error);
    }
}

export async function publisherRabbitMQEvent(exchangeName, exchangeType, routingKey, message) {
    try {
        const channel = await connectToRabbitMQ();
        if (!channel) throw new Error("Failed to get RabbitMQ channel");
        // if exchangeName is "fanout" then routingKey is ignored
        await assertExchange(exchangeName, exchangeType);
        await assertQueue(routingKey);
        channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
        logger.info(`Published event: ${routingKey} to RabbitMQ`);
    } catch (err) {
        logger.error(`Error publishing event to RabbitMQ: ${err.message}`);
    }
}

export async function consumeRabbitMQEvent(exchangeName, exchangeType, routingKey, callback) {
    try {
        const channel = await connectToRabbitMQ();
        if (!channel) throw new Error("Failed to get RabbitMQ channel");
        await assertExchange(exchangeName, exchangeType);
        await assertQueue(routingKey);
        const tq = await tempQueue()
        await channel.bindQueue(tq, exchangeName, routingKey);
        logger.info(`Binding queue ${routingKey} to exchange ${exchangeName}`);
        await channel.consume(tq, async (msg) => {
            if (msg !== null) {
                const message = JSON.parse(msg.content.toString());
                await callback(message);
                channel.ack(msg); // Acknowledge the message
            }
        }, { noAck: false });
        logger.info(`Listening for messages on queue: ${routingKey}`);
    } catch (err) {
        logger.error(`Error consuming RabbitMQ event: ${err.message}`);
    }
}

export async function deleteQueue(queueName) {
    try {
        const channel = await connectToRabbitMQ();
        if (!channel) throw new Error("Failed to get RabbitMQ channel");

        await channel.deleteQueue(queueName);
        logger.info(`Queue ${queueName} deleted`);
    } catch (err) {
        logger.error(`Error deleting RabbitMQ queue: ${err.message}`);
    }
}

export async function purgeQueue(queueName) {
    // Purging a queue means deleting all messages from the queue without deleting the queue itself.
    try {
        const channel = await connectToRabbitMQ();
        if (!channel) throw new Error("Failed to get RabbitMQ channel");

        await channel.purgeQueue(queueName);
        logger.info(`Queue ${queueName} purged`);
    } catch (err) {
        logger.error(`Error purging RabbitMQ queue: ${err.message}`);
    }
}


// Graceful Shutdown - Close Connection on Exit
process.on("SIGINT", async () => {
    if (rabbitMqChannel) await rabbitMqChannel.close();
    if (connection) await connection.close();
    logger.info("RabbitMQ connection closed gracefully");
    process.exit(0);
});
