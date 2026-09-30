const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env.');
  }

  mongoose.set('strictQuery', true);
  const options = { serverSelectionTimeoutMS: 10000 };
  if (process.env.MONGODB_DB) {
    options.dbName = process.env.MONGODB_DB;
  }

  try {
    await mongoose.connect(uri, options);
  } catch (error) {
    throw new Error(
      `Could not connect to MongoDB. Start MongoDB, then check MONGODB_URI in backend/.env. ${error.message}`,
    );
  }
}

function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = { connectDb, databaseStatus };
