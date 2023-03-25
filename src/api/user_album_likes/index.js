const { routes } = require('./routes');
const { UserAlbumLikesHandler } = require('./handler');

module.exports = {
  name: 'likes',
  version: '1.0.0',
  register: async (server, { userAlbumLikesService, usersService, albumsService }) => {
    const userAlbumLikesHandler = new UserAlbumLikesHandler(
      userAlbumLikesService,
      usersService,
      albumsService,
    );
    server.route(routes(userAlbumLikesHandler));
  },
};