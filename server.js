require('dotenv').config();
require('./services/transactionService');
require('./services/payoutService');
require('./services/endLotteries');

const express = require('express');
const bodyParser = require('body-parser');
const { Giveaway, Participant, Partner } = require('./models'); 
const auth = require('./middleware/auth');
const verifyCaptcha = require('./utils/verifyCaptcha');
const verifySignature = require('./utils/verifySignature'); 
const crypto = require('crypto');

function generateTaskToken() {
    return crypto.randomBytes(16).toString('hex');
}

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const jwt = require('jsonwebtoken');

app.post('/giveaways', auth, async (req, res) => {
    const { type, endsAt, tokenAddress, amount, receiverCount, taskUrl, secret } = req.body;

    // Validate input data
    if (!type || !amount || !receiverCount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type === 'lottery' && !endsAt) {
        return res.status(400).json({ error: 'Ending date is required for lottery type giveaways' });
    }

    const taskToken = taskUrl ? generateTaskToken() : null;

    try {
        const newGiveaway = await Giveaway.create({
            type,
            endsAt,
            tokenAddress: tokenAddress || null,
            amount,
            receiverCount,
            taskUrl: taskUrl || null,
            taskToken
        });

        const response = {
            giveawayLink: `https://my.tt/g/${newGiveaway.id}`,
            topUpLink: `ton://transfer/${process.env.MAIN_ADDRESS}?token=${tokenAddress}&amount=${amount * receiverCount}&comment=${newGiveaway.id}`,
            taskToken
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error creating giveaway:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post('/partners/authenticate', async (req, res) => {
    const { name, secret } = req.body;

    try {
        const partner = await Partner.findOne({ where: { name, isActive: true } });
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        if (partner.secret !== secret) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: partner.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/giveaways/:giveawayId/checkin', async (req, res) => {
    const { captchaToken, receiverAddress, publicKey, signedProof } = req.body;
    const { giveawayId } = req.params;

    if (!giveawayId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // // verify captcha
    // const isCaptchaValid = await verifyCaptcha(captchaToken);
    // if (!isCaptchaValid) {
    //     return res.status(400).json({ error: 'Invalid CAPTCHA token' });
    // }

    // // verify signature
    // if (!verifySignature(receiverAddress, publicKey, signedProof)) {
    //     return res.status(400).json({ error: 'Invalid signature' });
    // }

    // Check if the giveaway exists and is active
    try {
        const giveaway = await Giveaway.findByPk(giveawayId);
        if (!giveaway) {
            return res.status(404).json({ error: 'Giveaway not found' });
        }

        const participantCount = await Participant.count({
            where: giveawayId
        });

        if (participantCount == giveaway.receiverCount) {
            return res.status(400).json({ error: 'Maximum participants reached' });
        }

        let participantStatus = 'awaitingPayment';

        if (giveaway.taskUrl) {
            participantStatus = 'awaitingTask';
        }

        // Create or update the participant entry
        const participant = await Participant.findOrCreate({
            where: { giveawayId, receiverAddress },
            defaults: { status: participantStatus }
        });

        res.status(200).json({ ok: true, giveaway });
    } catch (error) {
        console.error('Error during check-in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/giveaways/:giveawayId/complete-task', async (req, res) => {
    const { taskToken, receiverAddress } = req.body;
    const { giveawayId } = req.params;

    try {
        const participant = await Participant.findOne({
            where: {
                giveawayId: giveawayId,
                receiverAddress: receiverAddress
            }
        });

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const giveaway = await Giveaway.findByPk(giveawayId);

        if (!giveaway || giveaway.taskToken !== taskToken) {
            return res.status(400).json({ error: 'Invalid task token or giveaway not found' });
        }

        // Update participant status to 'awaitingPayment'
        participant.status = 'awaitingPayment';
        await participant.save();

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/giveaways/:giveawayId', async (req, res) => {
    const { giveawayId } = req.params;

    try {
        const giveaway = await Giveaway.findByPk(giveawayId, {
            attributes: ['id', 'type', 'endsAt', 'tokenAddress', 'amount', 'receiverCount', 'taskUrl', 'status']
        });

        if (!giveaway) {
            return res.status(404).json({ error: 'Giveaway not found' });
        }

        const participantCount = await Participant.count({
            where: {giveawayId: giveawayId}
        });

        giveaway.participantCount = participantCount;
        res.status(200).json({
            ...giveaway.toJSON(), // Convert Sequelize instance to plain object
            participantCount: participantCount
        });
    } catch (error) {
        console.error('Failed to retrieve giveaway:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


