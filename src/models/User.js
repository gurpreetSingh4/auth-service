import mongoose from "mongoose"
import argon2 from "argon2"

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    role:{
        type: String,
        enum: ["user", "prime"],
        default: "user",
    }
},{
    timestamps: true
})

userSchema.pre("save", async function (next){
    if(this.isModified("password")) {
        try{
            this.password = await argon2.hash(this.password)
        }
        catch(error){
            next(error)
        }
    }
})

userSchema.methods.comparePassword = async function (candidatePassword){
    try{
        return await argon2.verify(this.password, candidatePassword)
    }
    catch(error){
        throw new Error(error)
    }
}

userSchema.index({username:"text"})

export const User = mongoose.model("User", userSchema)