require('dotenv').config();
const { TonClient, WalletContractV4, fromNano } = require("ton");
const { mnemonicToWalletKey } = require("ton-crypto");
const { Transaction } = require('../models');
const { Giveaway } = require('../models');

// Create Client
const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TON_API
});

async function getWalletTransactions() {
    try {
        let mnemonics = process.env.MAIN_ADDRESS_MNEMONICS;
        let key = await mnemonicToWalletKey(mnemonics.split(" "));

        let workchain = 0;
        let wallet = WalletContractV4.create({ workchain, publicKey: key.publicKey });
        let contract = client.open(wallet);

        let balance = await contract.getBalance();
        console.log('Balance:', fromNano(balance.toString()));

        let options = {
            limit: 10, 
        };
        let transactions = await client.getTransactions(wallet.address, options);
        // console.log("Transactions:", transactions);
        
        for (const tx of transactions) {
            const msgBody = tx.inMessage.body.toString();
            if (tx.inMessage.info.type == "internal"){
                const transactionHash =  tx.hash().toString('hex');
                const amount = tx.inMessage.info.value.coins.toString();
                const bodyHex = msgBody.substring(2, msgBody.length - 1);
                const giveawayId = parseInt(Buffer.from(bodyHex, 'hex').toString().match(/\d+/));

                if (!isNaN(giveawayId)){
                    const existingTransaction = await Transaction.findOne({
                        where: {
                            transactionHash: transactionHash
                        }
                    });
                    if (existingTransaction) {
                        console.log('Transaction with hash', transactionHash, 'exists.');
                    } else {
                        const transaction = await Transaction.create({
                            transactionHash,
                            amount,
                            giveawayId
                        });

                        const giveaway = await Giveaway.findOne({
                            where: { id: transaction.giveawayId }
                        });
                
                        if (giveaway && transaction.amount >= (giveaway.amount * giveaway.receiverCount)) {
                            giveaway.status = 'active';
                            await giveaway.save();
                            console.log(`Updated giveaway ${giveaway.id} to active.`);
                        }
                        
                        console.log('Transaction with added');
                    }
                }
                
            }
        }


    } catch (error) {
        console.error('Error getting transactions', error);
    }

}

setInterval(getWalletTransactions, 6000);
