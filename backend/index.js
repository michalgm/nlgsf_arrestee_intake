require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const formSubmit = require('./formSubmit');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(helmet());
app.use(bodyParser.json());
app.post('/submit', formSubmit);
app.use((err, req, res, _next) => {
  console.error(err);
  console.error(err.stack);
  res.status(500).json({ error: err.message || err });
});
app.listen(port, () => console.log(`Listening on port ${port}!`));
