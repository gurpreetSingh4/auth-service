import mongoose from "mongoose"

const RegisteredEmailDataSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
    },
    emailRefreshToken: {
      type: String,
    },
    picture: {
      type: String,
      default:process.env.DEFAULT_PROFILE_PIC,
    },
    name: {
      type: String,
    },
    sub: {
      type: String,
    },
  });

const UserRegisteredEmailsDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    registeredEmailsData: {
        type: [RegisteredEmailDataSchema],
        default: [],
    },
},{
    timestamps: true
})

export const UserRegisteredEmailsData = mongoose.model("UserRegisteredEmailsData", UserRegisteredEmailsDataSchema)