const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Backend đang chạy!');
});

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;
