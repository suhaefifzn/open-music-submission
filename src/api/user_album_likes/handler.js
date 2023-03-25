const autoBind = require('auto-bind');

class UserAlbumLikesHandler {
  constructor(userAlbumLikesService, usersService, albumsService) {
    this._userAlbumLikesService = userAlbumLikesService;
    this._usersService = usersService;
    this._albumsService = albumsService;

    autoBind(this);
  }

  async postUserAlbumLikeHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    await this._usersService.verifyUserId(userId);

    const { id: albumId } = request.params;
    await this._albumsService.checkAlbum(albumId);

    // cek user apakah sudah menyukai album atau belum
    const statusUser = await this._userAlbumLikesService
      .checkUserLikedAlbum(userId, albumId);

    // user telah menyukai album, jalankan unlike album
    if (statusUser > 0) {
      await this._userAlbumLikesService.unlikeAlbum(userId, albumId);

      return h.response({
        status: 'success',
        message: 'Album batal disukai',
      }).code(201);
    }

    // user belum menyukai album
    // ual = user album likes
    await this._userAlbumLikesService.likeAlbum(userId, albumId);

    return h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    }).code(201);
  }

  async getTotalAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;
    await this._albumsService.checkAlbum(albumId);

    const { totalLikes, source } = await this._userAlbumLikesService
      .countAlbumLiked(albumId);

    return h.response({
      status: 'success',
      data: {
        likes: totalLikes,
      },
    }).header('X-Data-Source', source);
  }
}

module.exports = { UserAlbumLikesHandler };