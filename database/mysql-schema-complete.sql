-- ============================================================
-- AI SMART AUTOMATION SYSTEM - COMPLETE MySQL SCHEMA
-- Run: mysql -u root -p < database/mysql-schema-complete.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_automation;
USE ai_automation;

-- ============================================================
-- 1. USERS TABLE (with face recognition support)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('SYSTEM_ADMIN','ORG_ADMIN','TEAM_LEAD','DEVELOPER','VIEWER') DEFAULT 'DEVELOPER',
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  face_descriptor TEXT DEFAULT NULL,
  face_registered_at TIMESTAMP NULL DEFAULT NULL,
  first_name VARCHAR(50) DEFAULT NULL,
  last_name VARCHAR(50) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  failed_login_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- ============================================================
-- 2. SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(255)),
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
);

-- ============================================================
-- 3. PASSWORD RESETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);

-- ============================================================
-- 4. PREDICTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  hour INT NOT NULL,
  usage_count INT NOT NULL,
  context VARCHAR(20) NOT NULL,
  battery_level INT DEFAULT 75,
  prediction VARCHAR(20) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  probabilities JSON DEFAULT NULL,
  explanation TEXT DEFAULT NULL,
  prediction_id VARCHAR(50) DEFAULT NULL,
  processing_time_ms INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_prediction (prediction)
);

-- ============================================================
-- 5. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- ============================================================
-- 6. BLOCKCHAIN LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS blockchain_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  block_number INT NOT NULL UNIQUE,
  block_hash VARCHAR(64) NOT NULL UNIQUE,
  previous_hash VARCHAR(64) NOT NULL,
  user_id INT DEFAULT NULL,
  user_role VARCHAR(50) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_block_number (block_number),
  INDEX idx_block_hash (block_hash),
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp)
);

-- ============================================================
-- 7. FACE LOGIN LOGS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS face_login_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  success BOOLEAN NOT NULL,
  confidence DECIMAL(5,2) DEFAULT NULL,
  match_score DECIMAL(5,2) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  failure_reason VARCHAR(200) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_success (success),
  INDEX idx_created_at (created_at)
);

-- ============================================================
-- 8. DEVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_name VARCHAR(100) DEFAULT NULL,
  device_type VARCHAR(50) DEFAULT NULL,
  os_type VARCHAR(50) DEFAULT NULL,
  os_version VARCHAR(50) DEFAULT NULL,
  device_token VARCHAR(500) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ============================================================
-- 9. AUTOMATION RULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_conditions JSON NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_config JSON NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_enabled (is_enabled)
);

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_unread (user_id, is_read),
  INDEX idx_created_at (created_at)
);

-- ============================================================
-- 11. SYSTEM METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_unit VARCHAR(20) DEFAULT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric_name (metric_name),
  INDEX idx_recorded_at (recorded_at)
);

-- ============================================================
-- SEED DATA - Default Users (password: password123)
-- bcrypt hash of 'password123' (verified working hash)
-- ============================================================
INSERT INTO users (username, email, password, role, status, first_name, last_name) VALUES
('superadmin', 'superadmin@system.com', '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u', 'SYSTEM_ADMIN', 'active', 'Super', 'Admin'),
('admin',      'admin@system.com',      '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u', 'ORG_ADMIN',   'active', 'Org',   'Admin'),
('manager',    'manager@system.com',    '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u', 'TEAM_LEAD',   'active', 'Team',  'Manager'),
('user1',      'user1@system.com',      '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u', 'DEVELOPER',   'active', 'Dev',   'One'),
('user2',      'user2@system.com',      '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u', 'DEVELOPER',   'active', 'Dev',   'Two'),
('demo',       'demo@system.com',       '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u', 'VIEWER',      'active', 'Demo',  'User')
ON DUPLICATE KEY UPDATE
  password = '$2b$10$OsBGhpwTa7FG8flgrwy2hOEQFO.GBXKcfFfuKt1K3ucnHZ4i.qa3u',
  status   = 'active';

-- Genesis Block
INSERT INTO blockchain_logs (block_number, block_hash, previous_hash, action, details) VALUES
(0, '0000000000000000000000000000000000000000000000000000000000000000', '0', 'Genesis Block', 'System initialization')
ON DUPLICATE KEY UPDATE block_number=block_number;

-- Sample audit log
INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES
(1, 'SYSTEM_INIT', 'Database initialized with default data', '127.0.0.1');

-- Sample system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES
('model_accuracy', 94.5, 'percent'),
('avg_response_time', 45, 'ms'),
('uptime', 100, 'percent');

SELECT '✅ Database setup complete! All tables created.' AS status;
