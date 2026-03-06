const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ai_automation_enterprise',
  user: 'postgres',
  password: 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!\n');

    // Get database info
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('📊 Database Information:');
    console.log(`   Database: ${dbInfo.rows[0].current_database}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}`);
    console.log(`   Version: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // Count tables
    const tables = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log(`📋 Tables: ${tables.rows[0].count}`);

    // Count users
    const users = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Users: ${users.rows[0].count}`);

    // Count predictions
    const predictions = await client.query('SELECT COUNT(*) as count FROM predictions');
    console.log(`🎯 Predictions: ${predictions.rows[0].count}`);

    // Count models
    const models = await client.query('SELECT COUNT(*) as count FROM ml_models WHERE status = \'active\'');
    console.log(`🤖 Active Models: ${models.rows[0].count}\n`);

    // Test query - Get a user
    const testUser = await client.query(`
      SELECT username, email, role, status 
      FROM users 
      WHERE username = 'admin'
    `);

    if (testUser.rows.length > 0) {
      console.log('✅ Test Query Successful:');
      console.log(`   Username: ${testUser.rows[0].username}`);
      console.log(`   Email: ${testUser.rows[0].email}`);
      console.log(`   Role: ${testUser.rows[0].role}`);
      console.log(`   Status: ${testUser.rows[0].status}\n`);
    }

    // Test RBAC query
    const permissions = await client.query(`
      SELECT COUNT(DISTINCT p.id) as permission_count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'admin'
    `);
    console.log(`🔐 Admin Permissions: ${permissions.rows[0].permission_count}\n`);

    client.release();

    console.log('🎉 All tests passed! Database is ready for use.\n');
    console.log('Connection String:');
    console.log('postgresql://postgres:postgres@localhost:5432/ai_automation_enterprise\n');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check database name: ai_automation_enterprise');
    console.error('3. Verify credentials: postgres/postgres');
    console.error('4. Run setup.bat to create the database\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test
testConnection();