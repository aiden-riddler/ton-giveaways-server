require('dotenv').config();
const { TonClient, WalletContractV4, fromNano, internal } = require("ton");
const { mnemonicToWalletKey } = require("ton-crypto");
const { Participant, Giveaway } = require('../models');

// Create Client
const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TON_API
});

async function processPayouts() {
    try {
        console.log("Processing payouts");
        let mnemonics = process.env.MAIN_ADDRESS_MNEMONICS;
        let key = await mnemonicToWalletKey(mnemonics.split(" "));

        let workchain = 0;
        let wallet = WalletContractV4.create({ workchain, publicKey: key.publicKey });
        let contract = client.open(wallet);

        // Find participants who are awaiting payment
        const participants = await Participant.findAll({
            where: { status: 'awaitingPayment' }
        });

        for (const participant of participants) {
            const giveaway = await Giveaway.findOne({
                where: { id: participant.giveawayId }
            });

            const seqno = await contract.getSeqno();

            // Send payment to participant's address
            await contract.sendTransfer({
                secretKey: key.secretKey,
                seqno: seqno,
                messages: [
                    internal({
                        to: participant.receiverAddress,
                        value: fromNano(giveaway.amount),
                        body: "giveaway",
                        bounce: false
                    })
                ]
            });

            let currentSeqno = seqno;
            while (currentSeqno == seqno) {
                console.log("waiting for transaction to confirm...", currentSeqno);
                await sleep(1500);
                currentSeqno = await contract.getSeqno();
            }
            console.log("transaction confirmed!");

            // Update participant's status to 'paid' in the database
            await Participant.update(
                { status: 'paid' },
                { where: { id: participant.id } }
            );

            console.log('Updated participant status to paid:', participant.id);
        }

    } catch (error) {
        console.error('Error processing payouts', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// module.exports = processPayouts;
setInterval(processPayouts, 10000);