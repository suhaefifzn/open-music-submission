const { routes } = require('./routes');
const { PlaylistsHandler } = require('./handler');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, {
    playlistsService,
    playlistsValidator,
    activitiesValidator,
  }) => {
    const playlistsHandler = new PlaylistsHandler(
      playlistsService,
      playlistsValidator,
      activitiesValidator,
    );
    server.route(routes(playlistsHandler));
  },
};