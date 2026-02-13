-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS sabil_al_khair;

USE sabil_al_khair;

-- Database Schema for Sabil Al-Khair Mosque Platform

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_important BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_collected DECIMAL(15, 2) NOT NULL DEFAULT 0,
    date BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY,
    mosque_name VARCHAR(255) NOT NULL DEFAULT 'سبيل الخير',
    rip VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS global_balance (
    id INT PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0
);

-- Insert default data
INSERT IGNORE INTO
    settings (id, mosque_name, rip)
VALUES (1, 'سبيل الخير', '');

INSERT IGNORE INTO global_balance (id, amount) VALUES (1, 0);