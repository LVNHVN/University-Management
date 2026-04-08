const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Missing MONGO_URI in .env');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();

  if (collections.length === 0) {
    console.log('No collections found. Database is already empty.');
    return;
  }

  for (const { name } of collections) {
    if (name.startsWith('system.')) {
      continue;
    }

    await db.collection(name).deleteMany({});
    console.log(`Cleared all documents in collection: ${name}`);
  }

  console.log('Database cleared successfully.');
}

clearDatabase()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Database clear failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors in failure path.
    }
    process.exit(1);
  });
