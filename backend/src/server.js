const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

const app = require('./app');
const dbService = require('./services/dbService');

const PORT = process.env.PORT || 5000;

// Initialize Database connection and launch server
const startServer = async () => {
  try {
    await dbService.connect();
    
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(` Employee Hub Server is running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Database: ${dbService.isFallback() ? 'Local JSON file fallback' : 'MongoDB'}`);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error('Failed to start Employee Hub Server:', error);
    process.exit(1);
  }
};

startServer();
