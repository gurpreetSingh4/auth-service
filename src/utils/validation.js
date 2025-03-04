import Joi from "joi"

export const validateRegisteration = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("user", "prime").default("user")
    })
    return schema.validate(data)
}

export const validateLogin = (data) => {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(6).required()
    })
    return schema.validate(data)
}