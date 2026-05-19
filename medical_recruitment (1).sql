-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 18, 2026 at 07:32 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `medical_recruitment`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL,
  `admin_user_id` int(11) NOT NULL,
  `hospital_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `admin_user_id`, `hospital_id`, `action_type`, `details`, `is_read`, `created_at`) VALUES
(3, 1, 5, 'post_job', 'Posted new job: surgery', 0, '2026-05-16 18:23:47'),
(4, 1, 5, 'hired', 'Updated application #8 to hired', 0, '2026-05-16 18:38:57'),
(5, 1, 5, 'interview_scheduled', 'Updated application #8 to interview_scheduled', 0, '2026-05-16 18:39:06'),
(6, 1, 5, 'schedule_interview', 'Scheduled interview for application #8 at 2025-01-15 10:00:00', 0, '2026-05-16 18:39:32'),
(7, 1, 5, 'hired', 'Updated application #8 to hired', 0, '2026-05-16 19:49:18'),
(8, 1, 5, 'post_job', 'Posted new job: cut', 0, '2026-05-16 19:50:32'),
(9, 1, 5, 'hired', 'Updated application #9 to hired', 0, '2026-05-16 23:55:22'),
(10, 1, 5, 'post_job', 'Posted new job: treate', 0, '2026-05-17 12:10:55'),
(11, 1, 5, 'schedule_interview', 'Scheduled interview for application #9 at 2025-01-15 10:00:00', 0, '2026-05-17 12:11:25'),
(12, 1, 5, 'schedule_interview', 'Scheduled interview for application #9 at 2025-01-15 10:00:00', 0, '2026-05-17 12:13:39'),
(13, 1, 5, 'schedule_interview', 'Scheduled interview for application #9 at 2025-01-15 10:00:00', 0, '2026-05-17 19:38:53'),
(14, 1, 5, 'post_job', 'Posted new job: hu', 0, '2026-05-17 20:08:21');

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `profile_photo` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_profiles`
--

INSERT INTO `admin_profiles` (`id`, `user_id`, `full_name`, `profile_photo`) VALUES
(1, 1, 'Admin User', 'uploads\\photos\\photo-1779048103066-465761447.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `admin_user_id` int(11) NOT NULL,
  `language` varchar(10) DEFAULT 'en',
  `theme` varchar(20) DEFAULT 'light',
  `timezone` varchar(50) DEFAULT 'Africa/Kigali',
  `custom_color` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`admin_user_id`, `language`, `theme`, `timezone`, `custom_color`) VALUES
(1, 'en', 'light', 'Africa/Kigali', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `status` enum('applied','shortlisted','interview_scheduled','rejected','hired') DEFAULT 'applied',
  `applied_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `rejection_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `job_id`, `doctor_id`, `status`, `applied_date`, `updated_at`, `rejection_reason`) VALUES
(9, 11, 4, 'interview_scheduled', '2026-05-16 23:44:23', '2026-05-17 12:11:12', NULL),
(10, 12, 4, 'rejected', '2026-05-17 12:55:21', '2026-05-17 19:37:44', 'i dont like experience');

-- --------------------------------------------------------

--
-- Table structure for table `broadcast_messages`
--

CREATE TABLE `broadcast_messages` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target_role` enum('all','doctor','hospital') DEFAULT 'all',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `broadcast_receipts`
--

CREATE TABLE `broadcast_receipts` (
  `id` int(11) NOT NULL,
  `broadcast_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `specialty` varchar(255) NOT NULL,
  `experience_years` int(11) DEFAULT 0,
  `location_pref` enum('urban','rural','both') DEFAULT 'both',
  `salary_expectation` decimal(12,2) DEFAULT NULL,
  `cv_path` varchar(500) DEFAULT NULL,
  `license_path` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_photo` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `full_name`, `specialty`, `experience_years`, `location_pref`, `salary_expectation`, `cv_path`, `license_path`, `bio`, `phone`, `created_at`, `updated_at`, `profile_photo`) VALUES
(4, 10, 'doctor', 'General Practice', 10, 'rural', 0.00, 'uploads\\cvs\\cv-1778956422151-584267854.pdf', 'uploads\\licenses\\license-1778956408550-403069834.pdf', 'no get', '0795494494', '2026-05-16 18:20:11', '2026-05-17 13:12:02', 'uploads\\photos\\photo-1779023521997-128724022.jpg'),
(5, 12, 'INEZA Sonia', 'Cardiology', 15, 'urban', 0.00, 'uploads\\cvs\\cv-1779030030528-382139480.pdf', 'uploads\\licenses\\license-1779030037006-21194687.pdf', 'no get', '0733487158', '2026-05-17 14:57:43', '2026-05-17 15:00:37', 'uploads\\photos\\photo-1779029966504-556280049.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hospital_name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `verification_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `suspended` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `location_verified` tinyint(1) DEFAULT 0,
  `profile_photo` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `user_id`, `hospital_name`, `location`, `contact_phone`, `description`, `verification_status`, `suspended`, `is_verified`, `latitude`, `longitude`, `address`, `location_verified`, `profile_photo`) VALUES
(5, 11, 'byumba', 'byumba', '0783443960', 'hospital ', 'pending', 0, 0, NULL, NULL, NULL, 0, 'uploads\\photos\\photo-1779048919656-196095568.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `hospital_verification`
--

CREATE TABLE `hospital_verification` (
  `id` int(11) NOT NULL,
  `hospital_id` int(11) NOT NULL,
  `license_path` varchar(500) NOT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interviews`
--

CREATE TABLE `interviews` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `scheduled_datetime` datetime NOT NULL,
  `meeting_link` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interviews`
--

INSERT INTO `interviews` (`id`, `application_id`, `scheduled_datetime`, `meeting_link`, `notes`, `status`) VALUES
(2, 8, '2025-01-15 10:00:00', 'https://meet.google.com/xxx', '', 'scheduled'),
(3, 9, '2025-01-15 10:00:00', 'https://meet.google.com/xxx', '', 'scheduled');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `hospital_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `specialty_required` varchar(255) NOT NULL,
  `location_type` enum('urban','rural') NOT NULL,
  `salary_range` varchar(100) DEFAULT NULL,
  `posted_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('open','closed') DEFAULT 'open',
  `is_verified` tinyint(1) DEFAULT 0,
  `admin_approved` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `hospital_id`, `title`, `description`, `specialty_required`, `location_type`, `salary_range`, `posted_date`, `status`, `is_verified`, `admin_approved`) VALUES
(11, 5, 'cut', 'support accident', 'General Practice', 'rural', '', '2026-05-16 19:50:32', 'open', 0, 0),
(12, 5, 'treate', 'treat people', 'General Practice', 'urban', '$60k', '2026-05-17 12:10:55', 'open', 0, 0),
(13, 5, 'hu', 'dfgh', 'General Practice', 'rural', '$65k', '2026-05-17 20:08:21', 'open', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `message`, `is_read`, `created_at`) VALUES
(52, 11, 10, 'hello doctor you can apply this job', 1, '2026-05-16 18:24:30'),
(53, 10, 11, 'give me answer faster', 1, '2026-05-16 18:35:44'),
(54, 10, 11, 'hy', 1, '2026-05-16 19:46:33'),
(55, 10, 11, 'hello', 1, '2026-05-16 23:46:39'),
(56, 10, 11, 'hy', 1, '2026-05-17 12:02:00'),
(57, 11, 10, 'hy doctor courage', 1, '2026-05-17 12:11:51'),
(58, 10, 11, 'byanze', 1, '2026-05-17 14:09:00'),
(60, 12, 11, 'hello', 1, '2026-05-17 15:02:04'),
(61, 10, 1, 'hy', 1, '2026-05-17 19:31:58'),
(62, 1, 10, 'hello', 1, '2026-05-17 19:59:11'),
(63, 1, 11, 'hy', 0, '2026-05-17 19:59:32'),
(64, 11, 12, 'hy', 0, '2026-05-17 20:08:57');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(90, 10, 'hello', 'hello every one', 1, '2026-05-16 19:10:53'),
(91, 10, 'New Job Match', 'A new \"cut\" position (rural) matching your profile has been posted.', 1, '2026-05-16 19:50:32'),
(92, 10, 'New Job Match', 'A new \"treate\" position (urban) matching your profile has been posted.', 1, '2026-05-17 12:10:55'),
(93, 10, 'Application interview_scheduled', 'An interview has been scheduled for you. For job: cut', 1, '2026-05-17 12:11:12'),
(94, 11, 'New Application', 'doctor applied for \"treate\".', 1, '2026-05-17 12:55:21'),
(96, 11, 'greet', 'helllo every one', 1, '2026-05-17 13:58:59'),
(97, 10, 'Application rejected', 'Your application was rejected. Reason: i dont like experience For job: treate', 1, '2026-05-17 19:37:44'),
(99, 11, 'hy', 'hy', 1, '2026-05-17 20:01:13'),
(100, 12, 'hy', 'hy', 0, '2026-05-17 20:01:13'),
(101, 10, 'New Job Match', 'A new \"hu\" position (rural) matching your profile has been posted.', 1, '2026-05-17 20:08:21');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reported_id` int(11) NOT NULL,
  `report_type` enum('fake_job','fake_hospital','inappropriate','other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','resolved','dismissed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `action`, `details`, `created_at`) VALUES
(55, 'broadcast', 'Sent to doctors: hello', '2026-05-16 19:10:53'),
(56, 'cleanup_jobs', 'Deleted 0 old closed jobs', '2026-05-16 23:58:50'),
(57, 'cleanup_jobs', 'Deleted 0 old closed jobs', '2026-05-17 00:00:56'),
(58, 'delete_job', 'Deleted job ID 10', '2026-05-17 00:01:05'),
(59, 'broadcast', 'Sent to alls: greet', '2026-05-17 13:58:59'),
(60, 'cleanup_jobs', 'Deleted 0 old closed jobs', '2026-05-17 13:59:44'),
(61, 'backup', 'Created backup file backup_1779026386480.json', '2026-05-17 13:59:46'),
(62, 'backup', 'Created backup file backup_1779026389010.json', '2026-05-17 13:59:49'),
(63, 'backup', 'Created backup file backup_1779026389091.json', '2026-05-17 13:59:49'),
(64, 'backup', 'Created backup file backup_1779026389318.json', '2026-05-17 13:59:49'),
(65, 'backup', 'Created backup file backup_1779026392430.json', '2026-05-17 13:59:52'),
(66, 'backup', 'Created backup file backup_1779026393597.json', '2026-05-17 13:59:53'),
(67, 'backup', 'Created backup file backup_1779026393708.json', '2026-05-17 13:59:53'),
(68, 'backup', 'Created backup file backup_1779026396009.json', '2026-05-17 13:59:56'),
(69, 'backup', 'Created backup file backup_1779026398643.json', '2026-05-17 13:59:58'),
(70, 'backup', 'Created backup file backup_1779026398780.json', '2026-05-17 13:59:58'),
(71, 'backup', 'Created backup file backup_1779026400526.json', '2026-05-17 14:00:00'),
(72, 'backup', 'Created backup file backup_1779026400730.json', '2026-05-17 14:00:00'),
(73, 'backup', 'Created backup file backup_1779026402607.json', '2026-05-17 14:00:02'),
(74, 'backup', 'Created backup file backup_1779026403928.json', '2026-05-17 14:00:03'),
(75, 'backup', 'Created backup file backup_1779026405162.json', '2026-05-17 14:00:05'),
(76, 'backup', 'Created backup file backup_1779026414510.json', '2026-05-17 14:00:14'),
(77, 'backup', 'Created backup file backup_1779026414706.json', '2026-05-17 14:00:14'),
(78, 'backup', 'Created backup file backup_1779026415776.json', '2026-05-17 14:00:15'),
(79, 'backup', 'Created backup file backup_1779026415965.json', '2026-05-17 14:00:15');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('doctor','hospital','admin') NOT NULL,
  `language` varchar(10) DEFAULT 'en',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `must_change_password` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `language`, `created_at`, `must_change_password`) VALUES
(1, 'admin@gmail.com', '$2b$10$U3ZYoVD.fKl1kd/ynTtwleG3Hx8zuKIAJLQHMq2RmxchlcZOv832C', 'admin', 'en', '2026-05-16 14:27:50', 0),
(10, 'doctor@gmail.com', '$2b$10$0ojv52fiLWcnBpKo5FqH/uipE7qo56O9uNRnZ.LVjekO9JupXmJbu', 'doctor', 'en', '2026-05-16 18:20:11', 0),
(11, 'hospital@gmail.com', '$2b$10$3OJA9Q2tKXRC6MTpzvo3t.TQhNYGiOSZriGaVa5xR6vIz/k9izxnK', 'hospital', 'en', '2026-05-16 18:21:22', 0),
(12, 'inezasonia@gmail.com', '$2b$10$FE.AJ3LpK4OJg7g/o.1jQuWyattJUGq3AaSTlBrRLERKkBU9hUFdG', 'doctor', 'fr', '2026-05-17 14:57:43', 0);

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_role_change` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    -- If role changed from doctor to hospital
    IF OLD.role = 'doctor' AND NEW.role = 'hospital' THEN
        -- Delete from doctors table
        DELETE FROM doctors WHERE user_id = NEW.id;
        
        -- Insert into hospitals table (with minimal info, ask user to complete later)
        INSERT INTO hospitals (user_id, hospital_name, location, contact_phone)
        VALUES (NEW.id, 'New Hospital', 'Unknown', NULL);
        
        -- Delete related applications (optional, because they are linked to doctor profile)
        DELETE FROM applications WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = NEW.id);
    END IF;

    -- If role changed from hospital to doctor
    IF OLD.role = 'hospital' AND NEW.role = 'doctor' THEN
        -- Delete from hospitals table
        DELETE FROM hospitals WHERE user_id = NEW.id;
        
        -- Insert into doctors table
        INSERT INTO doctors (user_id, full_name, specialty, experience_years, location_pref)
        VALUES (NEW.id, 'New Doctor', 'General Practice', 0, 'both');
        
        -- Delete related jobs posted by this hospital
        DELETE FROM jobs WHERE hospital_id = (SELECT id FROM hospitals WHERE user_id = NEW.id);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `user_id` int(11) NOT NULL,
  `notifications_enabled` tinyint(1) DEFAULT 1,
  `email_notifications` tinyint(1) DEFAULT 1,
  `theme` varchar(20) DEFAULT 'light'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_settings`
--

INSERT INTO `user_settings` (`user_id`, `notifications_enabled`, `email_notifications`, `theme`) VALUES
(10, 1, 1, 'light'),
(11, 1, 1, 'light'),
(12, 1, 1, 'dark');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_user_id` (`admin_user_id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`admin_user_id`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_application` (`job_id`,`doctor_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `broadcast_messages`
--
ALTER TABLE `broadcast_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `broadcast_receipts`
--
ALTER TABLE `broadcast_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_receipt` (`broadcast_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `hospital_verification`
--
ALTER TABLE `hospital_verification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `verified_by` (`verified_by`);

--
-- Indexes for table `interviews`
--
ALTER TABLE `interviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `reported_id` (`reported_id`),
  ADD KEY `resolved_by` (`resolved_by`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `broadcast_messages`
--
ALTER TABLE `broadcast_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `broadcast_receipts`
--
ALTER TABLE `broadcast_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `hospitals`
--
ALTER TABLE `hospitals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `hospital_verification`
--
ALTER TABLE `hospital_verification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviews`
--
ALTER TABLE `interviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD CONSTRAINT `admin_notifications_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_notifications_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `admin_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
