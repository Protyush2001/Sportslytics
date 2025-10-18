const Joi = require("joi");

const teamValidationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  coach: Joi.string().min(2).max(100).required(),
  players: Joi.array()
    .items(Joi.string().length(24).hex())
    .max(20)
    .required(),
  createdBy: Joi.string().length(24).hex().required(), 
});

module.exports = teamValidationSchema;