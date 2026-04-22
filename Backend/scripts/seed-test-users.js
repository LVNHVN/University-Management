const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../Models/User');
const TEST_USERS = [
  {
    username: 'AdminTest',
    password: '123456',
    role: 'admin',
    status: true,
  },
  {
    username: 'StudentTest',
    password: '123456',
    role: 'student',
    status: true,
  },
  {
    username: 'TeacherTest',
    password: '123456',
    role: 'teacher',
    status: true,
  },
];

async function seedTestUsers() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Missing MONGO_URI in .env');
  }

  await mongoose.connect(uri);

  for (const user of TEST_USERS) {
    const { username, password, role, status } = user;

    await User.findOneAndUpdate(
      { username },
      {
        $set: {
          username,
          password,
          role,
          status,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Upserted user: ${username} (${role})`);
  }

  console.log('Seed test users completed.');
}

seedTestUsers()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors in failure path.
    }
    process.exit(1);
  });
