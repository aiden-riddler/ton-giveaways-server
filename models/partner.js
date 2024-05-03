const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Import sequelize instance

const Partner = sequelize.define('partner', {
    address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    secret: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Partner;
