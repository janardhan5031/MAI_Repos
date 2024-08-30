// // In this file, you can configure migrate-mongo
require('dotenv').config({path: "src/common/config/development.env"});

const config = {
  mongodb: {
    url: process.env.DATABASE_CONNECTION,
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
