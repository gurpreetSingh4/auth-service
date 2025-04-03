import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config()

const encryptedKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encryptToken(token) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptedKey, iv);
    let encrypted = cipher.update(token, 'utf-8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    decryptToken(Buffer.concat([iv, encrypted]).toString('hex'))
    return Buffer.concat([iv, encrypted]).toString('hex');
}

export function decryptToken(encryptedToken) {
    const encryptedBuffer = Buffer.from(encryptedToken, 'hex');
    const iv = encryptedBuffer.subarray(0, 16);
    const encryptedData = encryptedBuffer.subarray(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptedKey, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf-8'); 
}

export function generateRandomPassword(length = 8) {
    return crypto.randomBytes(length)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .slice(0, length);
}