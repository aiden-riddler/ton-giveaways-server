const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Import sequelize instance

const Participant = sequelize.define('participant', {
    giveawayId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    receiverAddress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM,
        values: ['awaitingTask', 'awaitingPayment', 'paid', 'lost'],
        allowNull: false
    }
});

module.exports = Participant;
