const { InvariantError } = require('../../exceptions/InvariantError');
const { PlaylistPayloadSchema, PostSongToPlaylistSchema } = require('./schema');

const PlaylistsValidator = {
  validatePlaylistPayload: (payload) => {
    const validationResult = PlaylistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateSongPayload: (payload) => {
    const validationResult = PostSongToPlaylistSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = { PlaylistsValidator };