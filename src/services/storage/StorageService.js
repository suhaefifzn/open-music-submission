const fs = require('fs');
const { Pool } = require('pg');

class StorageService {
  constructor(folder) {
    this._folder = folder;
    this._pool = new Pool();

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const path = `${this._folder}/${filename}`;
    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }

  async postCover(cover, albumId) {
    // delete old cover from directory
    await this._deleteOldCoverFromDirectory(albumId);

    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${cover}`;
    const queryUpdate = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2',
      values: [coverUrl, albumId],
    };

    await this._pool.query(queryUpdate);
  }

  async _deleteOldCoverFromDirectory(albumId) {
    const queryGetCover = {
      text: 'SELECT albums."coverUrl" FROM albums WHERE id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(queryGetCover);

    if (result.rows[0].coverUrl === null) {
      return;
    }

    const oldCover = result.rows[0].coverUrl.split('/');

    fs.unlinkSync(`${this._folder}/${oldCover[oldCover.length - 1]}`);
  }
}

module.exports = { StorageService };