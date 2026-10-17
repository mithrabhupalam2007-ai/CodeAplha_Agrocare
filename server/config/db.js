const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI stored in the environment.
 * The connection string must never be exposed to the frontend.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env and set it.');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

/** Gracefully close the connection when the process shuts down. */
async function disconnectDB() {
  await mongoose.connection.close();
  console.log('[db] MongoDB connection closed');
}

module.exports = { connectDB, disconnectDB };
