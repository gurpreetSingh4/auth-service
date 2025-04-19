import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()
const jwtAccessTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    jwtAccessToken: {
        type: String,
        required: true,
    }
},{
    timestamps: true
})

jwtAccessTokenSchema.pre("save", async function (next){
    const existingToken = await this.constructor.findOne({ user: this.user})
    if(existingToken){
        await this.constructor.deleteOne({ user: this.user})
    }
    next()
})  

export const JwtAccessToken = mongoose.model("JwtAccessToken", jwtAccessTokenSchema)