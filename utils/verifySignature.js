const crypto = require('crypto');

/**
 * Verifies a signature.
 *
 * @param {string} message - The original message that was signed (receiverAddress).
 * @param {string} publicKey - The public key to verify the signature.
 * @param {string} signature - The signature in base64 format.
 * @returns {boolean} - Returns true if the signature is valid; otherwise, false.
 */
const verifySignature = (message, publicKey, signature) => {
    try {
        const verifier = crypto.createVerify('sha256');
        verifier.update(message);
        verifier.end();

        // Convert the public key to a format that can be used by crypto module
        const publicKeyBuffer = Buffer.from(publicKey, 'base64');
        const publicKeyFormatted = `-----BEGIN PUBLIC KEY-----\n${publicKeyBuffer.toString('base64')}\n-----END PUBLIC KEY-----`;

        // Verify the signature
        return verifier.verify(publicKeyFormatted, signature, 'base64');
    } catch (error) {
        console.error('Failed to verify signature:', error);
        return false;
    }
};

module.exports = verifySignature;
