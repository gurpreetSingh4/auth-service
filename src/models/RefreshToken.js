import mongoose from "mongoose"

const refreshTokenSchema = new mongoose.Schema({
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

refreshTokenSchema.index(
    {expiresAt: 1},
    {expireAfterSecounds: 0}
)

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema)