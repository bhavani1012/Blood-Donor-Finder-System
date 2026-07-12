-- Database Initialization Script for Blood Donor Finder System
-- Target: MySQL (XAMPP / Standalone MySQL Server)

CREATE DATABASE IF NOT EXISTS `blood_donor_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `blood_donor_db`;

-- Drop existing tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `ai_recommendations`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `request_documents`;
DROP TABLE IF EXISTS `blood_requests`;
DROP TABLE IF EXISTS `donor_locations`;
DROP TABLE IF EXISTS `admin`;
DROP TABLE IF EXISTS `recipients`;
DROP TABLE IF EXISTS `donors`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE (Unified user credentials & role division)
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(15) NOT NULL UNIQUE,
    `password_hash` VARCHAR(256) NOT NULL,
    `role` ENUM('donor', 'recipient', 'admin') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DONORS TABLE (Donor specific profiles)
CREATE TABLE `donors` (
    `user_id` INT PRIMARY KEY,
    `blood_group` VARCHAR(5) NOT NULL,
    `dob` DATE NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL,
    `profile_photo` VARCHAR(255) DEFAULT 'default_profile.svg',
    `is_available` TINYINT(1) DEFAULT 1,
    `last_donation_date` DATE DEFAULT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RECIPIENTS TABLE (Recipient specific profiles)
CREATE TABLE `recipients` (
    `user_id` INT PRIMARY KEY,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ADMIN TABLE (Administrator mapping)
CREATE TABLE `admin` (
    `user_id` INT PRIMARY KEY,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. DONOR LOCATIONS TABLE (Precise GPS Coordinates for location searches)
CREATE TABLE `donor_locations` (
    `donor_id` INT PRIMARY KEY,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`donor_id`) REFERENCES `donors` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BLOOD REQUESTS TABLE (Patient requests seeking approval and units)
CREATE TABLE `blood_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` INT NOT NULL,
    `patient_name` VARCHAR(150) NOT NULL,
    `blood_group` VARCHAR(5) NOT NULL,
    `hospital_name` VARCHAR(255) NOT NULL,
    `attender_name` VARCHAR(150) NOT NULL,
    `attender_phone` VARCHAR(15) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `units_required` INT NOT NULL,
    `emergency_level` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`recipient_id`) REFERENCES `recipients` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. REQUEST DOCUMENTS TABLE (Hospital proof uploads associated with requests)
CREATE TABLE `request_documents` (
    `request_id` INT PRIMARY KEY,
    `document_path` VARCHAR(255) NOT NULL,
    `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`request_id`) REFERENCES `blood_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. NOTIFICATIONS TABLE (Logs for recipient updates and emergency notifications)
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) DEFAULT 'general',
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AI RECOMMENDATIONS TABLE (Top ranked compatibility matrices)
CREATE TABLE `ai_recommendations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `request_id` INT NOT NULL,
    `donor_id` INT NOT NULL,
    `score` DECIMAL(5, 2) NOT NULL,
    `match_type` VARCHAR(50) NOT NULL,
    `distance_km` DECIMAL(6, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`request_id`) REFERENCES `blood_requests` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`donor_id`) REFERENCES `donors` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add search optimization indices
CREATE INDEX idx_donor_blood_group ON donors(blood_group);
CREATE INDEX idx_donor_city ON donors(city);
CREATE INDEX idx_donor_pincode ON donors(pincode);
CREATE INDEX idx_request_blood_group ON blood_requests(blood_group);
CREATE INDEX idx_request_city ON blood_requests(city);

-- ==========================================
-- SEED DATA SETUP
-- ==========================================

-- Seeding Users (Passwords hashed using default pbkdf2:sha256 algorithm with default flask settings)
-- Admin account: admin@blooddonor.com / Admin123
-- Donor 1: donor1@blooddonor.com / Donor123
-- Donor 2: donor2@blooddonor.com / Donor123
-- Recipient: recipient@blooddonor.com / Recipient123
-- (The hashes below map to 'pbkdf2:sha256:600000$...' or similar Werkzeug hashes.
--  We seed hashes compatible with Flask-Security/Werkzeug security check.)

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `role`) VALUES
(1, 'System Administrator', 'admin@blooddonor.com', '9999999999', 'scrypt:32768:8:1$i8Z7Q02gD7Qd9wVb$4a132c32cf9de8b71d9d9bbdf6ff641320ef45763cb6df99392e2e92c2db81ef0e85ff86d066ad929c490a61f22e7240166d1656b26c79a835a6cfd740cfa959', 'admin'),
(2, 'Amit Kumar Sharma', 'donor1@blooddonor.com', '9876543210', 'scrypt:32768:8:1$i8Z7Q02gD7Qd9wVb$cb42a781b2a92a5436d4df927b2a99d425712e0227181e1ad5b508f7cb679db448ff3c706ee9a8b11116c4983226db94901f4c547f897623a63ad1e847c234a9', 'donor'),
(3, 'Priya Visakhapatnam', 'donor2@blooddonor.com', '8765432109', 'scrypt:32768:8:1$i8Z7Q02gD7Qd9wVb$cb42a781b2a92a5436d4df927b2a99d425712e0227181e1ad5b508f7cb679db448ff3c706ee9a8b11116c4983226db94901f4c547f897623a63ad1e847c234a9', 'donor'),
(4, 'Ramesh Babu Recipient', 'recipient@blooddonor.com', '7654321098', 'scrypt:32768:8:1$i8Z7Q02gD7Qd9wVb$33b2bf80b2a92a5436d4df927b2a99d425712e0227181e1ad5b508f7cb679db448ff3c706ee9a8b11116c4983226db94901f4c547f897623a63ad1e847c234a9', 'recipient');

INSERT INTO `admin` (`user_id`) VALUES (1);

-- Seeding Donors (Amit is A+, Priya is O-)
-- Visual coordinates set in Visakhapatnam center (approx 17.6868, 83.2185)
INSERT INTO `donors` (`user_id`, `blood_group`, `dob`, `gender`, `address`, `city`, `pincode`, `profile_photo`, `is_available`, `last_donation_date`) VALUES
(2, 'A+', '1995-08-15', 'Male', 'D.No 45-2-12, Dwaraka Nagar', 'Visakhapatnam', '530016', 'default_profile.svg', 1, '2026-03-01'),
(3, 'O-', '1998-11-22', 'Female', 'Fl.No 404, MVP Colony', 'Visakhapatnam', '530017', 'default_profile.svg', 1, '2026-04-10');

INSERT INTO `donor_locations` (`donor_id`, `latitude`, `longitude`) VALUES
(2, 17.72140000, 83.30820000), -- Dwaraka Nagar area
(3, 17.74100000, 83.33200000); -- MVP Colony area

-- Seeding Recipients
INSERT INTO `recipients` (`user_id`, `address`, `city`) VALUES
(4, 'Plot 88, Kirlampudi Layout', 'Visakhapatnam');

-- Seeding requests
INSERT INTO `blood_requests` (`id`, `recipient_id`, `patient_name`, `blood_group`, `hospital_name`, `attender_name`, `attender_phone`, `city`, `units_required`, `emergency_level`, `status`, `created_at`) VALUES
(1, 4, 'Srinivasa Rao', 'A+', 'Seven Hills Hospital', 'Ramesh Babu', '7654321098', 'Visakhapatnam', 3, 'Critical', 'Approved', CURRENT_TIMESTAMP);

INSERT INTO `request_documents` (`request_id`, `document_path`) VALUES
(1, 'sample_proof.pdf');

INSERT INTO `notifications` (`user_id`, `message`, `type`) VALUES
(4, 'Your emergency blood request for patient Srinivasa Rao has been approved by the administrator.', 'status_update'),
(2, 'Urgent: A critical request for A+ blood has been approved near your location.', 'alert');
