const axios = require('axios');
const nodemailer = require('nodemailer');
const startCase = require('lodash.startcase');
const fs = require('fs/promises');
const lockfile = require('proper-lockfile');

const { EMAILS, ENABLE_EMAIL, ENABLE_FILE } = process.env;
const FROM_EMAIL = 'memoryhole-legal-database@proton.me';
const MIN_SCORE = 0.5;
const DATA_PATH = process.env.DATA_PATH || '../data/';

const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 1025,
  secure: false, // True for 465, false for other ports
  auth: {
    user: process.env.PROTONMAIL_LOGIN,
    pass: process.env.PROTONMAIL_PW,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const formatEmail = (data) => {
  // let htmlTable = '<table style="width:100%;border-collapse:collapse;border: 1px solid #ccc;">';

  const rows = Object.entries(data).map(([key, value]) => `\n<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><b>${startCase(key)}</b></td><td style="padding: 8px; border-bottom: 1px solid #ddd; width:100%;">${value}</td></tr>`).join('');

  return `<table style="width:100%;border-collapse:collapse;border: 1px solid #ccc;">${rows}</table>`;
};

// Async..await is not allowed in global scope, must use a wrapper
async function send_email(data) {
  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: `MemoryHole Legal DB" <${FROM_EMAIL}>`, // Sender address
    to: EMAILS, // List of receivers
    subject: 'New Arrestee Intake', // Subject line
    html: formatEmail(data), // Html body
  });

  console.log('Message sent: %s', info.messageId);
}

const captcha = async (token) => {
  const secretKey = process.env.CAPTCHA_SECRET_KEY;
  const url = 'https://www.google.com/recaptcha/api/siteverify';
  const {
    data: { success, score },
  } = await axios.post(url, null, {
    params: { secret: secretKey, response: token },
  });
  if (!success || score < MIN_SCORE) {
    return Promise.reject(new Error('Captcha validation failed'));
  }
  return score;
};

const write_file = async (data) => {
  const filename = `${DATA_PATH}${new Date().toJSON()}.json`;
  const json_data = JSON.stringify(data);
  const fh = await fs.open(filename, 'a');
  await fh.close();
  await lockfile.lock(filename);
  await fs.writeFile(filename, json_data);
  await fs.chmod(filename, 0o600);
  await lockfile.unlock(filename);
};

const formSubmit = async (req, res) => {
  const { data, token } = req.body;
  console.log('processing');
  await captcha(token);
  await Promise.all([
    ENABLE_EMAIL && send_email(data),
    ENABLE_FILE && write_file(data),
  ]);
  return res.send('ok');
};

module.exports = formSubmit;
