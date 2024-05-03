const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection setup
const sequelize = new Sequelize('mytonwallet_giveaways', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
});

module.exports = sequelize;