/* eslint-disable arrow-body-style */
const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumsService, albumsValidator, songsService) {
    this._albumsService = albumsService;
    this._albumsValidator = albumsValidator;
    this._songsService = songsService;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._albumsValidator.validateAlbumPayload(request.payload);

    const albumId = await this._albumsService.addAlbum(request.payload);

    return h.response({
      status: 'success',
      data: {
        albumId,
      },
    }).code(201);
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);
    const songs = await this._songsService.getAlbumWithSongsByAlbumId(id);

    return h.response({
      status: 'success',
      data: {
        album: {
          ...album,
          songs,
        },
      },
    });
  }

  async putAlbumByIdHandler(request, h) {
    this._albumsValidator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);

    return h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    });
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    return h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });
  }
}

module.exports = { AlbumsHandler };