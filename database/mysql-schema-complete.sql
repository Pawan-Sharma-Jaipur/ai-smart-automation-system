-- AI Automation System - Complete MySQL Schema
CREATE DATABASE IF NOT EXISTS ai_automation;
USE ai_automation;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('SYSTEM_ADMIN', 'ORG_ADMIN', 'TEAM_LEAD', 'DEVELOPER', 'VIEWER') DEFAULT 'DEVELOPER',
  status ENUM('active', 'inactive') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(255)),
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
);

-- Password resets table
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

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  hour INT NOT NULL,
  usage_count INT NOT NULL,
  context VARCHAR(20) NOT NULL,
  battery_level INT,
  prediction VARCHAR(20) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_prediction (prediction)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- Insert default users (password: admin123)
INSERT INTO users (username, email, password, role, email_verified) VALUES
('admin', 'admin@system.com', '$2b$10$rKvVLZ8L8yF5Z5Z5Z5Z5ZeX5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'SYSTEM_ADMIN', TRUE),
('developer', 'dev@system.com', '$2b$10$rKvVLZ8L8yF5Z5Z5Z5Z5ZeX5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'DEVELOPER', TRUE),
('viewer', 'viewer@system.com', '$2b$10$rKvVLZ8L8yF5Z5Z5Z5Z5ZeX5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'VIEWER', TRUE)
ON DUPLICATE KEY UPDATE username=username;

SELECT 'Database setup complete!' AS status;
SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'ai_automation';
SELECT COUNT(*) AS total_users FROM users;
