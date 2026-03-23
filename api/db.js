import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;

export async function connectToDatabase() {
  if (cachedClient) return cachedClient;

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}
