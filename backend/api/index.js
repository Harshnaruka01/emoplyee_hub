const app = require('../src/app');
const dbService = require('../src/services/dbService');

let isConnected = false;

module.exports = async (req, res) => {
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
