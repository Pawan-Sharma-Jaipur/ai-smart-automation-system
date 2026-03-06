-- Use existing database
USE ai_smart_automation_system;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'User', 'Manager', 'Guest') DEFAULT 'User',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hour INT NOT NULL,
    usage_count INT NOT NULL,
    context INT NOT NULL,
    battery_level INT DEFAULT 75,
    prediction VARCHAR(20) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    ai_prediction VARCHAR(50),
    blockchain_tx VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Test Users
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@test.com', 'admin123', 'Admin'),
('user1', 'user1@test.com', 'user123', 'User'),
('manager', 'manager@test.com', 'manager123', 'Manager'),
('demo', 'demo@test.com', 'demo123', 'Guest')
ON DUPLICATE KEY UPDATE username=username;
