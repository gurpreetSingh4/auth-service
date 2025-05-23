import Joi from "joi"

export const validateRegisteration = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("guest", "prime").default("guest"),
    })
    return schema.validate(data)
}

export const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    })
    return schema.validate(data)
}