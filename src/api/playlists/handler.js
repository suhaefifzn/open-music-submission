const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistService, playlistValidator, activitiesValidator) {
    // Playlists
    this._playlistService = playlistService;
    this._playlistValidator = playlistValidator;
    this._activitiesValidator = activitiesValidator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._playlistValidator.validatePlaylistPayload(request.payload);

    const { id: userId } = request.auth.credentials;
    const { name } = request.payload;

    const playlistId = await this._playlistService.addPlaylist({
      name,
      owner: userId,
    });

    return h.response({
      status: 'success',
      data: {
        playlistId,
      },
    }).code(201);
  }

  async getPlaylistsHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const playlists = await this._playlistService.getPlaylists(userId);

    return h.response({
      status: 'success',
      data: {
        playlists,
      },
    });
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistOwner(playlistId, userId);
    await this._playlistService.deletePlaylistById(playlistId);

    return h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });
  }

  async postSongToPlaylistByIdHandler(request, h) {
    this._playlistValidator.validateSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;
    const { songId } = request.payload;

    await this._playlistService.verifyPlaylistAccess(playlistId, userId);

    const activityPayload = {
      playlist_id: playlistId,
      song_id: songId,
      user_id: userId,
      action: 'add',
      time: new Date().toISOString(),
    };

    this._activitiesValidator.validateActivityPayload(activityPayload);

    await this._playlistService.addSongToPlaylistById({
      playlistId, songId, activityPayload,
    });

    return h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    }).code(201);
  }

  async getSongsInPlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistAccess(playlistId, userId);

    const playlist = await this._playlistService.getPlaylistId(playlistId);
    const songs = await this._playlistService.getSongsInPlaylistById(playlistId);

    return h.response({
      status: 'success',
      data: {
        playlist: {
          ...playlist,
          songs,
        },
      },
    });
  }

  async deleteSongInPlaylistByIdHandler(request, h) {
    this._playlistValidator.validateSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;
    const { songId } = request.payload;

    await this._playlistService.verifyPlaylistAccess(playlistId, userId);

    const activityPayload = {
      playlist_id: playlistId,
      song_id: songId,
      user_id: userId,
      action: 'delete',
      time: new Date().toISOString(),
    };

    this._activitiesValidator.validateActivityPayload(activityPayload);

    await this._playlistService.deleteSongInPlaylistById({
      playlistId, songId, activityPayload,
    });

    return h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    });
  }

  async getActivitiesByPlaylistIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistAccess(playlistId, userId);
    const activities = await this._playlistService.getActivitiesByPlaylistId(playlistId);

    return h.response({
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    });
  }
}

module.exports = { PlaylistsHandler };