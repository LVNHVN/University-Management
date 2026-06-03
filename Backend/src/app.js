const express = require('express');
const cors = require('cors');
const path = require('path');
const { CORS_ORIGINS } = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = CORS_ORIGINS
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
    }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('API Backend đang chạy!');
});

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;
