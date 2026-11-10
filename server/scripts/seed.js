import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from './seedData.js';

dotenv.config();

const runSeed = async () => {
  try {
    await connectDB();
    const shouldReset = process.argv.includes('--reset');
    const summary = await seedDatabase({ reset: shouldReset });

    console.log('[Seed] Database seeded successfully:');
    console.log(`  - Instructor: ${summary.instructor.email} / Instructor123!`);
    console.log(`  - Student:    ${summary.student.email} / Student123!`);
    console.log(`  - Problems:   ${summary.problemsCount} problems ready`);
  } catch (err) {
    console.error('[Seed] Failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

runSeed();
