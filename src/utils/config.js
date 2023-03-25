const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  token: {
    age: process.env.ACCESS_TOKEN_AGE,
    access: process.env.ACCESS_TOKEN_KEY,
    refresh: process.env.REFRESH_TOKEN_KEY,
  },
  rabbitmq: {
    server: process.env.RABBITMQ_SERVER,
  },
  redis: {
    host: process.env.REDIS_SERVER,
  },
};

module.exports = { config };