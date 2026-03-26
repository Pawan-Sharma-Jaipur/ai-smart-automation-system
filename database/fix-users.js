const bcrypt = require('C:/Users/pawan/OneDrive/Desktop/BitAce/projects/ai-smart-automation-system/services/api-gateway/node_modules/bcryptjs');
const mysql = require('C:/Users/pawan/OneDrive/Desktop/BitAce/projects/ai-smart-automation-system/services/api-gateway/node_modules/mysql2/promise');

async function fixPasswords() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ai_automation'
  });

  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);

  // Delete and re-insert all users with fresh hash
  await db.execute('DELETE FROM users WHERE username IN (?,?,?,?,?,?)',
    ['superadmin','admin','manager','user1','user2','demo']);

  const users = [
    ['superadmin', 'superadmin@system.com', hash, 'SYSTEM_ADMIN', 'Super', 'Admin'],
    ['admin',      'admin@system.com',      hash, 'ORG_ADMIN',   'Org',   'Admin'],
    ['manager',    'manager@system.com',    hash, 'TEAM_LEAD',   'Team',  'Manager'],
    ['user1',      'user1@system.com',      hash, 'DEVELOPER',   'Dev',   'One'],
    ['user2',      'user2@system.com',      hash, 'DEVELOPER',   'Dev',   'Two'],
    ['demo',       'demo@system.com',       hash, 'VIEWER',      'Demo',  'User'],
  ];

  for (const [username, email, password, role, first_name, last_name] of users) {
    await db.execute(
      'INSERT INTO users (username, email, password, role, status, first_name, last_name) VALUES (?,?,?,?,?,?,?)',
      [username, email, password, role, 'active', first_name, last_name]
    );
    console.log(`✅ Created: ${username}`);
  }

  // Verify
  const [rows] = await db.execute('SELECT username, status, LEFT(password,10) as hash FROM users');
  console.table(rows);

  await db.end();
  console.log('\n✅ Done! Login with password: password123');
}

fixPasswords().catch(console.error);
