const { AlbumsHandler } = require('./handler');
const { routes } = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { albumsService, albumsValidator, songsService }) => {
    const albumsHandler = new AlbumsHandler(albumsService, albumsValidator, songsService);
    server.route(routes(albumsHandler));
  },
};