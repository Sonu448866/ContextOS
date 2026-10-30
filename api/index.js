const { createApp } = require('../server/dist/app');
const { connectDatabase } = require('../server/dist/config/database');

let appInstance = null;

module.exports = async (req, res) => {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err);
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
};
