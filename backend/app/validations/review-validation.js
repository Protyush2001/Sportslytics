
const Joi = require('joi');

const reviewValidationSchema = Joi.object({
    user: Joi.string(),
    name: Joi.string().required(),
    text: Joi.string().min(2).max(500).required(),
    rating: Joi.number().min(1).max(5).required()
});

module.exports = reviewValidationSchema;
