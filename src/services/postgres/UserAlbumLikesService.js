const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { InvariantError } = require('../../exceptions/InvariantError');

class UserAlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async likeAlbum(userId, albumId) {
    const id = `ual-${nanoid(16)}`; // ual = User Album Likes
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`liked_album:${albumId}`);
    return result.rows[0].id;
  }

  async unlikeAlbum(userId, albumId) {
    const query = {
      text: `
        DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2
      `,
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal untuk batal menyukai album');
    }

    await this._cacheService.delete(`liked_album:${albumId}`);
    return result.rowCount;
  }

  async checkUserLikedAlbum(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    return result.rowCount;
  }

  async countAlbumLiked(albumId) {
    try {
      const result = await this._cacheService.get(`liked_album:${albumId}`);
      return {
        totalLikes: JSON.parse(result),
        source: 'cache',
      };
    } catch (error) {
      const query = {
        text: 'SELECT user_album_likes.album_id FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      await this._cacheService
        .set(`liked_album:${albumId}`, JSON.stringify(result.rowCount));

      return {
        totalLikes: result.rowCount,
        source: 'postgresql',
      };
    }
  }
}

module.exports = { UserAlbumLikesService };