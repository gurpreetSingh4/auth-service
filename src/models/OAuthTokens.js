import mongoose from "mongoose"

const oAuthTokensSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    id_token: {
        type: String,
        required: true,
    },
    scope: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String,
        required: true,
    },
},{
    timestamps: true
})

export const OAuthTokens = mongoose.model("OAuthTokens", oAuthTokensSchema)