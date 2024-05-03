const { Giveaway, Participant } = require('./models');
const { Op } = require('sequelize');

async function endLotteries() {
    try {
        // Find all giveaways that have ended and are still marked as 'active'
        const endedGiveaways = await Giveaway.findAll({
            where: {
                endsAt: { [Op.lt]: new Date() }, 
                status: 'active',
                type: 'lottery'
            }
        });

        for (const giveaway of endedGiveaways) {
            // Fetch all participants
            const participants = await Participant.findAll({
                where: { 
                    giveawayId: giveaway.id,
                }
            });

            if (participants.length > 0) {
                // Randomly select winners
                const winners = selectRandomWinners(participants, giveaway.receiverCount);

                await Participant.update(
                    { status: 'lost' },
                    { where: { giveawayId: giveaway.id } }
                );

                for (const winner of winners) {
                    await Participant.update(
                        { status: 'awaitingPayment' },
                        { where: { id: winner.id } }
                    );
                }
            }

            // Update the giveaway status to 'finished'
            await giveaway.update({ status: 'finished' });
        }
    } catch (error) {
        console.error('Error ending lotteries:', error);
    }
}

function selectRandomWinners(participants, count) {

    const shuffled = participants.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, count);
}

// Run the task every 5 seconds
setInterval(endLotteries, 5000);
