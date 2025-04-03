import mongoose from "mongoose"
import argon2 from "argon2"
import dotenv from "dotenv"

dotenv.config()
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
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
    oAuthSub:{
        type: String,
    },
    profilePicture:{
        type: String,
        default:process.env.DEFAULT_PROFILE_PIC,
    },
    role:{
        type: String,
        enum: ["guest", "prime"],
        default: "guest",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
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