const mongoose = require('mongoose');
require('dotenv').config();

// Load all models so Mongoose registers schemas and indexes.
require('../Models/User');
require('../Models/Student');
require('../Models/Teacher');
require('../Models/Subject');
require('../Models/Class');
require('../Models/Enrollment');
require('../Models/Schedule');
require('../Models/Attendance');
require('../Models/Tuition');
require('../Models/Notification');
require('../Models/Curriculum');

async function initAtlas() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Missing MONGO_URI in .env');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  const modelNames = mongoose.modelNames();
  console.log(`Found ${modelNames.length} models: ${modelNames.join(', ')}`);

  for (const modelName of modelNames) {
    const model = mongoose.model(modelName);

    await model.createCollection();
    await model.syncIndexes();

    console.log(`Synced collection and indexes for ${modelName}`);
  }

  await mongoose.disconnect();
  console.log('Atlas initialization complete');
}

initAtlas()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Atlas initialization failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors in failure path.
    }
    process.exit(1);
  });
