const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

const app = require('../backend/src/app');
const dbService = require('../backend/src/services/dbService');

let isConnected = false;

module.exports = async (req, res) => {
  // Gracefully handle database connection initialization
  if (!isConnected) {
    try {
      await dbService.connect();
      isConnected = true;
    } catch (err) {
      console.error('Failed to connect database in serverless function:', err);
    }
  }
  return app(req, res);
};
