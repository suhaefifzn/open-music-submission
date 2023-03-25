const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { InvariantError } = require('../../exceptions/InvariantError');
const { NotFoundError } = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: `
        INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id
      `,
      values: [id, title, year, genre, performer, duration, albumId, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    if (title && performer) {
      const query = {
        text: `
          SELECT id, title, performer FROM songs WHERE lower(title)
           like $1 AND lower(performer) LIKE $2
        `,
        values: [`%${title}%`, `%${performer}%`],
      };
      const result = await this._pool.query(query);
      return result.rows;
    }

    if (title) {
      const query = {
        text: `
          SELECT id, title, performer FROM songs WHERE lower(title) like $1
        `,
        values: [`%${title}%`],
      };
      const result = await this._pool.query(query);
      return result.rows;
    }

    if (performer) {
      const query = {
        text: `
          SELECT id, title, performer FROM songs WHERE lower(performer) like $1
        `,
        values: [`%${performer}%`],
      };
      const result = await this._pool.query(query);
      return result.rows;
    }

    const result = await this._pool.query('SELECT id, title, performer FROM songs');
    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows[0];
  }

  async editSongById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    const updatedAt = new Date().toISOString();
    const text = `
      UPDATE songs SET
       title = $1, year = $2, genre = $3, performer = $4,
        duration = $5, "albumId" = $6, updated_at = $7
         WHERE id = $8 RETURNING id
    `;
    const values = [title, year, genre, performer, duration, albumId, updatedAt, id];
    const query = { text, values };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
    }
  }

  async getAlbumWithSongsByAlbumId(id) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = { SongsService };