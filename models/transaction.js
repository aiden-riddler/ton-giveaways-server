const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Import the sequelize instance

const Transaction = sequelize.define('transaction', {
    transactionHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Hash of the transaction'
    },
    giveawayId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: true
});

module.exports = Transaction;
