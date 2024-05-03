const axios = require('axios');

const verifyCaptcha = async (captchaToken) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; 
    const url = `https://www.google.com/recaptcha/api/siteverify`;

    try {
        const response = await axios.post(url, {}, {
            params: {
                secret: secretKey,
                response: captchaToken
            }
        });
        return response.data.success;
    } catch (error) {
        console.error('CAPTCHA verification failed:', error);
        return false;
    }
};

module.exports = verifyCaptcha;
