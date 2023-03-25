const Joi = require('joi');

const ActivityPayloadSchema = Joi.object({
  playlist_id: Joi.string().required(),
  song_id: Joi.string().required(),
  user_id: Joi.string().required(),
  action: Joi.string().required(),
  time: Joi.string().required(),
});

module.exports = { ActivityPayloadSchema };