const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { InvariantError } = require('../../exceptions/InvariantError');
const { NotFoundError } = require('../../exceptions/NotFoundError');
const { AuthorizationError } = require('../../exceptions/AuthorizationError');
const { ClientError } = require('../../exceptions/ClientError');

class PlaylistsService {
  constructor({
    songsService, collaborationsService, activitiesService,
  }) {
    this._pool = new Pool();
    this._songsService = songsService;
    this._collaborationsService = collaborationsService;
    this._activitiesService = activitiesService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
        SELECT playlists.id, playlists.name, users.username FROM playlists
         LEFT JOIN users ON users.id = playlists.owner
          LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
           WHERE playlists.owner = $1 OR collaborations.user_id = $1
      `,
      values: [owner],
    };
    const result = await this._pool.query(query);

    return result.rows;
  }

  async getPlaylistId(id) {
    const query = {
      text: `
        SELECT playlists.id, playlists.name, users.username FROM playlists
         LEFT JOIN users ON users.id = playlists.owner
          WHERE playlists.id = $1
      `,
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlists gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylistById({
    playlistId, songId, activityPayload,
  }) {
    await this._songsService.getSongById(songId);

    const id = `playlist_songs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    await this._activitiesService.addActivity(activityPayload);

    return result.rows[0].id;
  }

  async getSongsInPlaylistById(id) {
    const query = {
      text: `
        SELECT songs.id, songs.title, songs.performer FROM songs
         LEFT JOIN playlist_songs ON songs.id = playlist_songs.song_id
          WHERE playlist_songs.playlist_id = $1
      `,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows;
  }

  async deleteSongInPlaylistById({
    playlistId, songId, activityPayload,
  }) {
    const query = {
      text: `
        DELETE FROM playlist_songs
         WHERE playlist_id = $1 AND song_id = $2
      `,
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }

    await this._activitiesService.addActivity(activityPayload);
  }

  // eslint-disable-next-line consistent-return
  async getActivitiesByPlaylistId(id) {
    try {
      const result = await this._activitiesService.getActivities(id);
      return result;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Resource yang Anda minta tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = { PlaylistsService };