require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const path = require('path');
const Inert = require('@hapi/inert');
const { config } = require('./utils/config');
const { ClientError } = require('./exceptions/ClientError');

// Albums
const albums = require('./api/albums');
const { AlbumsService } = require('./services/postgres/AlbumsService');
const { AlbumsValidator } = require('./validator/albums');

// Songs
const songs = require('./api/songs');
const { SongsService } = require('./services/postgres/SongsService');
const { SongsValidator } = require('./validator/songs');

// Users
const users = require('./api/users');
const { UsersService } = require('./services/postgres/UsersService');
const { UsersValidator } = require('./validator/users');

// Authentications
const authentications = require('./api/authentications');
const { AuthenticationsService } = require('./services/postgres/AuthenticationsService');
const { TokenManager } = require('./tokenize/TokenManager');
const { AuthenticationsValidator } = require('./validator/authentications');

// Playlists
const playlists = require('./api/playlists');
const { PlaylistsService } = require('./services/postgres/PlaylistsService');
const { PlaylistsValidator } = require('./validator/playlists');

// Collaborations
const collaborations = require('./api/collaborations');
const { CollaborationsService } = require('./services/postgres/CollaborationsService');
const { CollaborationsValidator } = require('./validator/collaborations');

// Activities
const { ActivitiesService } = require('./services/postgres/ActivitiesService');
const { ActivitiesValidator } = require('./validator/activities');

// Exports
const _exports = require('./api/exports');
const { ProducerService } = require('./services/rabbitmq/ProducerService');
const { ExportsValidator } = require('./validator/exports');

// Uploads
const uploads = require('./api/uploads');
const { StorageService } = require('./services/storage/StorageService');
const { UploadsValidator } = require('./validator/uploads');

// Likes
const likes = require('./api/user_album_likes');
const { UserAlbumLikesService } = require('./services/postgres/UserAlbumLikesService');

// Cache
const { CacheService } = require('./services/redis/CacheService');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const activitiesService = new ActivitiesService();
  const collaborationsService = new CollaborationsService(usersService);
  const playlistsService = new PlaylistsService({
    songsService, collaborationsService, activitiesService,
  });
  const storageService = new StorageService(
    path.resolve(__dirname, 'api/uploads/file/images'),
  );
  const cacheService = new CacheService();
  const userAlbumLikesService = new UserAlbumLikesService(cacheService);

  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.token.access,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.token.age,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        albumsValidator: AlbumsValidator,
        songsService,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        playlistsValidator: PlaylistsValidator,
        activitiesValidator: ActivitiesValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        playlistsService,
        producerService: ProducerService,
        validator: ExportsValidator,
      },
    },
    {
      plugin: uploads,
      options: {
        service: storageService,
        validator: UploadsValidator,
      },
    },
    {
      plugin: likes,
      options: {
        userAlbumLikesService,
        usersService,
        albumsService,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        return h.response({
          status: 'fail',
          message: response.message,
        }).code(response.statusCode);
      }

      if (!response.isServer) {
        return h.continue;
      }

      return h.response({
        status: 'fail',
        message: 'Terjadi kesalahan pada server',
      }).code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan di ${server.info.uri}`);
};

init();