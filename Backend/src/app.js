const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('API Backend đang chạy!');
});

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;
