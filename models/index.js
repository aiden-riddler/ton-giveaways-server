const sequelize = require('../config/database');
const Giveaway = require('./giveaway');
const Partner = require('./partner');
const Participant = require('./participant');
const Transaction = require('./transaction');


// Test database connection
async function testDatabaseConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync();  // Sync all models
        console.log('All models were synchronized successfully.');
        // const partnersData = [
        //     { address: 'TETSTTSTTS', name: 'Tyrion', secret: 'helloworld' }
        // ];
        // await Promise.all(partnersData.map(async (partnerData) => {
        //     await Partner.create(partnerData);
        // }));
        // console.log('Partners inserted successfully');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testDatabaseConnection();

module.exports = {
    Giveaway,
    Partner,
    Participant,
    Transaction
};
