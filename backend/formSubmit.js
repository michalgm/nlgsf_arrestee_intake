const lockfile = require('proper-lockfile');
const axios = require('axios');
const fs = require('fs').promises;
const file = `${process.env.DATA_PATH}/data.txt`;

const minScore = 0.5;

const retries = {
  retries: 5,
  minTimeout: 1 * 1000,
  maxTimeout: 60 * 1000,
  randomize: true,
};

const captcha = async (req) => {
  const secret_key = process.env.CAPTCHA_SECRET_KEY;
  const token = req.body.token;
  const url = `https://www.google.com/recaptcha/api/siteverify`;
  const { data: { success, score } } = await axios.post(url, null, { params: { secret: secret_key, response: token } })
  if (!success || score < minScore) {
    return Promise.reject("Captcha validation failed")
  }
}

const formSubmit = async (req, res) => {
  await captcha(req)
  try {
    await fs.access(file)
  } catch (e) {
    fs.appendFile(file, '')
  }

  const release = await lockfile.lock(file, { retries });
  const data = JSON.stringify(req.body.data)
  await fs.appendFile(file, `${data}\n`)
  release()
  return res.send('ok')
};
module.exports = formSubmit
