-- Create database
CREATE DATABASE IF NOT EXISTS ai_automation_db;
USE ai_automation_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'User', 'Guest', 'Child', 'Employee') DEFAULT 'User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  ai_prediction VARCHAR(50),
  blockchain_tx VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@example.com', '$2b$10$rKZYvJ8B7lXhQZ5YvJ8B7eKZYvJ8B7lXhQZ5YvJ8B7lXhQZ5YvJ8B7', 'Admin');

-- Insert sample regular user (password: user123)
INSERT INTO users (username, email, password, role) VALUES 
('testuser', 'user@example.com', '$2b$10$rKZYvJ8B7lXhQZ5YvJ8B7eKZYvJ8B7lXhQZ5YvJ8B7lXhQZ5YvJ8B7', 'User');
