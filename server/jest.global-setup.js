const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async function () {
  const testDbPath = path.join(__dirname, 'prisma', 'test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
  });
};
