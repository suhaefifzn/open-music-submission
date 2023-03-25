const { Pool } = require('pg');
const { nanoid } = require('nanoid');

class ActivitiesService {
  constructor(validator) {
    this._pool = new Pool();
    this._validator = validator;
  }

  async addActivity(payload) {
    const {
      playlist_id: playlistId, song_id: songId, user_id: userId, action, time,
    } = payload;

    const id = `activity-${nanoid(16)}`;
    const query = {
      text: `
        INSERT INTO playlist_song_activities
         VALUES($1, $2, $3, $4, $5, $6)
      `,
      values: [id, playlistId, songId, userId, action, time],
    };

    await this._pool.query(query);
  }

  async getActivities(playlistId) {
    const query = {
      text: `
        SELECT playlist_song_activities.action, playlist_song_activities.time,
         users.username, songs.title FROM playlist_song_activities
          INNER JOIN users ON playlist_song_activities.user_id = users.id
           INNER JOIN songs ON playlist_song_activities.song_id = songs.id
            WHERE playlist_id = $1
      `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = { ActivitiesService };