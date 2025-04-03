import axios from "axios"
import dotenv from "dotenv"
import { logger } from "../utils/logger.js";
import { User } from "../models/user.js";
import { OAuthTokens } from "../models/OAuthTokens.js";
import { redisClient } from "../config/redis-client.js";
import { encryptToken, generateRandomPassword } from "../utils/cryptoFunctions.js";
import { generateJwtToken, refreshAuthToken } from "../utils/generateToken.js";

dotenv.config({
    path: './.env'
})


async function getTokens(code){
    try{
        const tokenResponse = await axios.post(process.env.TOKEN_ENDPOINT, null, {
            params: {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URL ,
                grant_type: 'authorization_code'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const { access_token, expires_in, refresh_token, scope, token_type, id_token } = tokenResponse.data;
        return { access_token, expires_at: Date.now() + expires_in * 1000, refresh_token, scope, token_type, id_token };
    }catch(error){
        logger.error('Error exchanging code for tokens:', error.response.data);
        res.status(500).json({
             message: 'Failed to exchange code for oauth tokens',
             success: false
        });
    }
}

async function getUserInfo(accessToken){
    try{
        const { data } = await axios.get(process.env.USER_INFO_ENDPOINT, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return data;
    }catch(error){
        logger.error('Error fetching user info:', error.response.data);
        res.status(500).json({
            message: 'Error fetching user info',
            success: false
        });
    }
}

export function getGoogleOAuthUrl(){
    const options= {
        redirect_uri:process.env.GOOGLE_REDIRECT_URL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        response_type: 'code',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/documents.readonly',
        ].join(' '),
        access_type: 'offline',  // Required to get refresh token
        prompt: 'consent'
    }
    const queryString = new URLSearchParams(options).toString();
    return `${process.env.OAUTH_ROOT_URL}?${queryString}`;
}

export const finalizeOAuth = async (req, res) => {
    logger.info("Finalize OAuth end point hit...")
    try{
        const { code } = req.query;
        if(!code){
            logger.warn("Authorization code not provided")
            return res.status(400).json({
                success: false,
                message: "Authorization code not provided"
            })
        }
        const tokens = await getTokens(code)
        if(!tokens){
            logger.warn("Failed to get tokens")
            return res.status(500).json({
                success: false,
                message: "Failed to get tokens"
            })
        }

        const userInfo = await getUserInfo(tokens.access_token)
        if(!userInfo){
            logger.warn("Failed to get user info")
            return res.status(500).json({
                success: false,
                message: "Failed to get user info"
            })
        }

        const {sub, name, email, picture} = userInfo // sub is the unique identifier for the user in Google
        const isUserExist = await User.findOne({email})
        if(isUserExist){
            logger.info("User already exists")
            const jwtAccessToken = generateJwtToken(isUserExist)
            await redisClient.set(`${process.env.AUTHACCESSTOKENREDIS}:${isUserExist._id}`, jwtAccessToken, 'EX', 3599 );
            isUserExist.password = undefined // remove password from user object
            req.user = isUserExist
            return res.status(200).json({
                success: true,
                message: "User already exists and access token is updated",
                data: isUserExist._id
            })
        }

        const defaultPassword = generateRandomPassword(8)

        const newUser = new User({
            name,
            email,
            password: defaultPassword, 
            oAuthSub: sub,
            profilePicture: picture
        })
        await newUser.save()

// **************** pending ********* send email to user with default password

        logger.info("User registered successfully", newUser._id)

        const { refresh_token, scope, id_token} = tokens
        const encryptedRefreshToken = encryptToken(refresh_token)
        const newTokensData = new OAuthTokens({
            user: newUser._id,
            id_token,
            refresh_token: encryptedRefreshToken,
            scope
        })
        await newTokensData.save()
        const jwtAccessToken = generateJwtToken(newUser)
        await redisClient.set(`${process.env.AUTHACCESSTOKENREDIS}:${newUser._id}`, jwtAccessToken, 'EX', 3599);
        logger.info("Tokens saved successfully", newTokensData._id)

         const refreshTokenInterval = setInterval(async()=>{
              try{
                const refreshToken = await refreshAuthToken(newUser);
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

        res.status(200).json({
            success: true,
            message: "OAuth flow completed successfully",
            data: newUser._id,
        })
    }catch(error){
        logger.error("Error finalizing OAuth", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

