-- ============================================
-- DATABASE VERIFICATION SCRIPT
-- Run this to verify database setup
-- ============================================

\echo '============================================'
\echo 'DATABASE VERIFICATION'
\echo '============================================'
\echo ''

-- Check database exists
\echo '1. Database Information:'
SELECT current_database() as database_name, 
       current_user as connected_user,
       version() as postgres_version;
\echo ''

-- Count tables
\echo '2. Tables Created:'
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
\echo ''

-- List all tables
\echo '3. Table List:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
\echo ''

-- Count indexes
\echo '4. Indexes Created:'
SELECT COUNT(*) as total_indexes 
FROM pg_indexes 
WHERE schemaname = 'public';
\echo ''

-- Count views
\echo '5. Views Created:'
SELECT COUNT(*) as total_views 
FROM information_schema.views 
WHERE table_schema = 'public';
\echo ''

-- Data verification
\echo '6. Data Verification:'
SELECT 'Organizations' as table_name, COUNT(*) as row_count FROM organizations
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'ML Models', COUNT(*) FROM ml_models
UNION ALL
SELECT 'Predictions', COUNT(*) FROM predictions
UNION ALL
SELECT 'Devices', COUNT(*) FROM devices
UNION ALL
SELECT 'Automation Rules', COUNT(*) FROM automation_rules;
\echo ''

-- Test users
\echo '7. Test Users:'
SELECT username, email, role, status 
FROM users 
ORDER BY role;
\echo ''

-- Active models
\echo '8. Active ML Models:'
SELECT name, version, status, accuracy 
FROM ml_models 
WHERE status = 'active';
\echo ''

-- Recent predictions
\echo '9. Recent Predictions:'
SELECT COUNT(*) as total_predictions,
       AVG(confidence) as avg_confidence
FROM predictions;
\echo ''

-- RBAC verification
\echo '10. RBAC Configuration:'
SELECT r.name as role, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY permission_count DESC;
\echo ''

\echo '============================================'
\echo 'VERIFICATION COMPLETE!'
\echo '============================================'
\echo ''
\echo 'If all checks passed, your database is ready!'
\echo ''