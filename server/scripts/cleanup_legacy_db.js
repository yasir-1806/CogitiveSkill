const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanupLegacyDatabase() {
  const legacyDbUri = 'mongodb://localhost:27017/cognitive-assessment';
  
  try {
    console.log(`Connecting to legacy database: ${legacyDbUri}...`);
    const conn = await mongoose.createConnection(legacyDbUri).asPromise();
    console.log('Connected to legacy MongoDB.');

    const collections = ['assignedtests', 'courseregistrations', 'results', 'slotbookings'];
    
    for (const colName of collections) {
      console.log(`Cleaning up collection: ${colName}...`);
      try {
        const result = await conn.collection(colName).deleteMany({});
        console.log(`Deleted ${result.deletedCount} records from ${colName}.`);
      } catch (e) {
        console.log(`Collection ${colName} might not exist or error occurred: ${e.message}`);
      }
    }

    // Handle users - delete non-admins if role exists
    console.log('Cleaning up users in legacy database...');
    try {
      const userCol = conn.collection('users');
      const deletedUsers = await userCol.deleteMany({ role: { $ne: 'admin' } });
      console.log(`Deleted ${deletedUsers.deletedCount} non-admin users from legacy database.`);
    } catch (e) {
      console.log(`Error cleaning users: ${e.message}`);
    }

    console.log('\nLegacy database cleanup completed.');
    await conn.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during legacy cleanup:', error);
    process.exit(1);
  }
}

cleanupLegacyDatabase();
