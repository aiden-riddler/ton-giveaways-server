const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Import sequelize instance

const Giveaway = sequelize.define('giveaway', {
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    endsAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tokenAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiverCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    taskUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    taskToken: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    status: {
        type: DataTypes.ENUM,
        values: ['pending', 'active', 'finished'],
        defaultValue: 'pending'
    }
}, {
    timestamps: true
});

module.exports = Giveaway;
