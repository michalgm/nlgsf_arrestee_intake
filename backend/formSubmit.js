const axios = require('axios');
const nodemailer = require("nodemailer");
const startCase = require('lodash.startcase');
const emails = process.env.EMAILS
const email = "memoryhole-legal-database@proton.me"
const minScore = 0.5;

const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 1025,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.PROTONMAIL_LOGIN,
        pass: process.env.PROTONMAIL_PW,
    },
    tls: {
        rejectUnauthorized: false,
    },
})

const formatEmail = data => {

    let htmlTable = '<table style="width:100%;border-collapse:collapse;border: 1px solid #ccc;">';

    for (const [key, value] of Object.entries(data)) {
        htmlTable += `\n<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><b>${startCase(key)}</b></td><td style="padding: 8px; border-bottom: 1px solid #ddd; width:100%;">${value}</td></tr>`;
    }

    htmlTable += '</table>';
    return htmlTable
}

// async..await is not allowed in global scope, must use a wrapper
async function send_email(data) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: `MemoryHole Legal DB" <${email}>`, // sender address
        to: emails, // list of receivers
        subject: "New Arrestee Intake", // Subject line
        html: formatEmail(data), // html body
    });

    console.log("Message sent: %s", info.messageId);
}

const captcha = async (token) => {
    const secret_key = process.env.CAPTCHA_SECRET_KEY;
    const url = `https://www.google.com/recaptcha/api/siteverify`;
    const { data: { success, score } } = await axios.post(url, null, { params: { secret: secret_key, response: token } })
    if (!success || score < minScore) {
        return Promise.reject("Captcha validation failed")
    }
}

const formSubmit = async (req, res) => {
    const { data, token } = req.body
    console.log('processing')
    await captcha(token)
    await send_email(data)
    return res.send('ok')
}

module.exports = formSubmit
