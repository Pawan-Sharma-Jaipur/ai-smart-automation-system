-- ============================================
-- SEED DATA FOR ENTERPRISE DATABASE
-- Initial data for testing and development
-- ============================================

-- ============================================
-- 1. ORGANIZATIONS
-- ============================================

INSERT INTO organizations (id, name, domain, industry, size, status) VALUES
('00000000-0000-0000-0000-000000000001', 'Enterprise Corp', 'enterprise.com', 'Technology', 'enterprise', 'active'),
('00000000-0000-0000-0000-000000000002', 'Startup Inc', 'startup.com', 'SaaS', 'startup', 'trial');

-- ============================================
-- 2. DEPARTMENTS
-- ============================================

INSERT INTO departments (id, organization_id, name, description) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering', 'Software Development'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Operations', 'IT Operations'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Sales', 'Sales Team');

-- ============================================
-- 3. USERS (Passwords are bcrypt hashed 'password123')
-- ============================================

INSERT INTO users (id, username, email, password, first_name, last_name, organization_id, department_id, role, status, email_verified) VALUES
-- Super Admin
('20000000-0000-0000-0000-000000000001', 'superadmin', 'superadmin@enterprise.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'super_admin', 'active', TRUE),

-- Admin
('20000000-0000-0000-0000-000000000002', 'admin', 'admin@enterprise.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'admin', 'active', TRUE),

-- Manager
('20000000-0000-0000-0000-000000000003', 'manager', 'manager@enterprise.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manager', 'User', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'manager', 'active', TRUE),

-- Regular Users
('20000000-0000-0000-0000-000000000004', 'user1', 'user1@enterprise.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'user', 'active', TRUE),

('20000000-0000-0000-0000-000000000005', 'user2', 'user2@enterprise.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'user', 'active', TRUE),

-- Demo User
('20000000-0000-0000-0000-000000000006', 'demo', 'demo@enterprise.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', '00000000-0000-0000-0000-000000000002', NULL, 'user', 'active', TRUE);

-- ============================================
-- 4. ROLES
-- ============================================

INSERT INTO roles (id, organization_id, name, display_name, description, level, is_system) VALUES
('30000000-0000-0000-0000-000000000001', NULL, 'system_admin', 'System Administrator', 'Full system access', 0, TRUE),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'org_admin', 'Organization Admin', 'Organization-level admin', 1, FALSE),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'team_lead', 'Team Lead', 'Team management', 2, FALSE),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'developer', 'Developer', 'Development access', 3, FALSE),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'viewer', 'Viewer', 'Read-only access', 4, FALSE);

-- ============================================
-- 5. PERMISSIONS
-- ============================================

INSERT INTO permissions (id, name, display_name, resource, action, is_system) VALUES
-- User permissions
('40000000-0000-0000-0000-000000000001', 'users.create', 'Create Users', 'users', 'create', TRUE),
('40000000-0000-0000-0000-000000000002', 'users.read', 'Read Users', 'users', 'read', TRUE),
('40000000-0000-0000-0000-000000000003', 'users.update', 'Update Users', 'users', 'update', TRUE),
('40000000-0000-0000-0000-000000000004', 'users.delete', 'Delete Users', 'users', 'delete', TRUE),

-- AI/ML permissions
('40000000-0000-0000-0000-000000000005', 'ai.predict', 'Make Predictions', 'ai', 'predict', TRUE),
('40000000-0000-0000-0000-000000000006', 'ai.train', 'Train Models', 'ai', 'train', TRUE),
('40000000-0000-0000-0000-000000000007', 'ai.manage', 'Manage Models', 'ai', 'manage', TRUE),

-- Automation permissions
('40000000-0000-0000-0000-000000000008', 'automation.create', 'Create Automations', 'automation', 'create', TRUE),
('40000000-0000-0000-0000-000000000009', 'automation.execute', 'Execute Automations', 'automation', 'execute', TRUE),

-- Admin permissions
('40000000-0000-0000-0000-000000000010', 'admin.access', 'Admin Panel Access', 'admin', 'access', TRUE),
('40000000-0000-0000-0000-000000000011', 'admin.audit', 'View Audit Logs', 'admin', 'audit', TRUE);

-- ============================================
-- 6. ROLE PERMISSIONS MAPPING
-- ============================================

-- System Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT '30000000-0000-0000-0000-000000000001', id FROM permissions;

-- Org Admin gets most permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000005'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000007'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000010'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000011');

-- Developer gets AI and automation permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000008'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000009');

-- Viewer gets read-only
INSERT INTO role_permissions (role_id, permission_id) VALUES
('30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002');

-- ============================================
-- 7. USER ROLES ASSIGNMENT
-- ============================================

INSERT INTO user_roles (user_id, role_id) VALUES
('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'), -- superadmin
('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002'), -- admin
('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003'), -- manager
('20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004'), -- user1
('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004'), -- user2
('20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005'); -- demo

-- ============================================
-- 8. ML MODELS
-- ============================================

INSERT INTO ml_models (id, name, display_name, type, version, status, accuracy) VALUES
('50000000-0000-0000-0000-000000000001', 'smartphone_automation', 'Smartphone Automation Predictor', 'neural_network', '2.0.0', 'active', 94.50),
('50000000-0000-0000-0000-000000000002', 'smartphone_automation', 'Smartphone Automation Predictor', 'neural_network', '1.0.0', 'deprecated', 89.20);

-- ============================================
-- 9. SAMPLE PREDICTIONS
-- ============================================

INSERT INTO predictions (id, model_id, user_id, input_features, prediction, confidence, probabilities) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 
 '{"hour": 14, "usageCount": 25, "context": 1, "batteryLevel": 75}'::jsonb, 
 'Vibrate', 87.50, '{"Silent": 20, "Vibrate": 87, "Normal": 13}'::jsonb),

('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 
 '{"hour": 23, "usageCount": 5, "context": 0, "batteryLevel": 30}'::jsonb, 
 'Silent', 92.30, '{"Silent": 92, "Vibrate": 5, "Normal": 3}'::jsonb),

('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 
 '{"hour": 10, "usageCount": 15, "context": 2, "batteryLevel": 80}'::jsonb, 
 'Vibrate', 85.60, '{"Silent": 10, "Vibrate": 85, "Normal": 5}'::jsonb);

-- ============================================
-- 10. SAMPLE DEVICES
-- ============================================

INSERT INTO devices (id, user_id, device_name, device_type, os_type, os_version) VALUES
('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'iPhone 14 Pro', 'smartphone', 'iOS', '17.0'),
('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'Samsung Galaxy S23', 'smartphone', 'Android', '14.0');

-- ============================================
-- 11. SAMPLE AUTOMATION RULES
-- ============================================

INSERT INTO automation_rules (id, user_id, device_id, name, trigger_type, trigger_conditions, action_type, action_config) VALUES
('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001',
 'Night Mode Auto', 'time_based', '{"hour": 22}'::jsonb, 'set_mode', '{"mode": "silent"}'::jsonb),

('80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001',
 'Work Mode Auto', 'location_based', '{"location": "work"}'::jsonb, 'set_mode', '{"mode": "vibrate"}'::jsonb);

-- ============================================
-- 12. SAMPLE NOTIFICATIONS
-- ============================================

INSERT INTO notifications (id, user_id, type, title, message, priority) VALUES
('90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'info', 'Welcome!', 'Welcome to the AI Automation System', 'normal'),
('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'success', 'Automation Active', 'Your automation rule "Night Mode Auto" is now active', 'normal');

-- ============================================
-- END OF SEED DATA
-- ============================================

-- Display summary
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_organizations FROM organizations;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_permissions FROM permissions;
SELECT COUNT(*) as total_predictions FROM predictions;