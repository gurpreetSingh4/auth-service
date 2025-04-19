import mongoose from "mongoose"

const oAuthRefreshTokenSchema = new mongoose.Schema({
    token:{
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    }
},{
    timestamps: true
})

export const RefreshToken = mongoose.model("OAuthRefreshToken", oAuthRefreshTokenSchema)