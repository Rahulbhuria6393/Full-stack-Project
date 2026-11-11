import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let memoryServer = null;

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/evalengine';
  try {
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 2500 });
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 10000, family: 4 });
    return { mode: 'external', uri: primaryUri };
  } catch (primaryErr) {
    const allowFallback = process.env.USE_MEMORY_DB_FALLBACK !== 'false';
    if (!allowFallback) {
      console.error(`[DB] Failed to connect to MongoDB: ${primaryErr.message}`);
      throw primaryErr;
    }

    console.warn(
      `[DB] Primary MongoDB (${primaryUri}) unavailable (${primaryErr.message}). Falling back to local embedded MongoDB...`
    );

    const fallbackPort = Number(process.env.MEMORY_DB_PORT || 27018);
    const fallbackUri = `mongodb://127.0.0.1:${fallbackPort}/evalengine`;

    // If another local process (e.g. running dev server) already started the embedded mongod, connect to it
    try {
      await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 1000 });
      console.log(`[DB] Connected to active embedded MongoDB at ${fallbackUri}`);
      return { mode: 'embedded-client', uri: fallbackUri };
    } catch {
      // Otherwise spin up mongodb-memory-server backed by persistent wiredTiger storage
    }

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(__dirname, '../.mongodb-data');
    await fs.mkdir(dbPath, { recursive: true });

    try {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          port: fallbackPort,
          dbName: 'evalengine',
          dbPath,
          storageEngine: 'wiredTiger',
        },
      });
    } catch {
      // Fallback to pure ephemeral memory instance if persistent dbPath fails or is locked
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'evalengine' },
      });
    }

    const uri = memoryServer.getUri('evalengine');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[DB] Connected to embedded MongoDB at ${uri}`);
    return { mode: 'embedded', uri };
  }
};

export const disconnectDB = async () => {
  if (memoryServer && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().command({ fsync: 1 });
    } catch {
      // ignore if already closing
    }
  }
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) {
    await memoryServer.stop().catch(() => {});
    memoryServer = null;
  }
};
