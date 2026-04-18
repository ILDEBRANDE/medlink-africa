-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 18, 2026 at 10:22 PM
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
-- Database: `medlink_africa`
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
(1, 2, 1, 'post_job', 'Posted new job: surgery', 0, '2026-04-18 20:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(2, 'en', 'light', 'Africa/Kigali', NULL);

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
(1, 2, 1, 'applied', '2026-04-13 22:34:33', '2026-04-13 22:34:33', NULL),
(2, 1, 1, 'interview_scheduled', '2026-04-13 23:01:46', '2026-04-17 09:26:39', NULL),
(3, 3, 1, 'applied', '2026-04-14 09:19:18', '2026-04-14 09:19:18', NULL),
(4, 4, 1, 'rejected', '2026-04-15 15:30:53', '2026-04-17 09:26:29', NULL),
(5, 5, 1, 'rejected', '2026-04-17 07:27:41', '2026-04-17 10:43:52', 'you  have ivalid licence');

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

--
-- Dumping data for table `broadcast_messages`
--

INSERT INTO `broadcast_messages` (`id`, `title`, `message`, `target_role`, `created_by`, `created_at`, `is_deleted`) VALUES
(1, 'google met', 'tomorrow we have google meet', 'all', 2, '2026-04-15 17:10:42', 0);

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

--
-- Dumping data for table `broadcast_receipts`
--

INSERT INTO `broadcast_receipts` (`id`, `broadcast_id`, `user_id`, `is_read`, `read_at`) VALUES
(1, 1, 3, 0, NULL),
(2, 1, 4, 0, NULL);

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `full_name`, `specialty`, `experience_years`, `location_pref`, `salary_expectation`, `cv_path`, `license_path`, `bio`, `phone`, `created_at`, `updated_at`) VALUES
(1, 3, 'TWAHUJUMUTIMA Ildebrande', 'General Practice', 5, 'urban', 5.00, 'uploads\\cvs\\cv-1776267035943-964854252.pdf', 'uploads\\licenses\\license-1776123645622-41893336.docx', NULL, '0795494474', '2026-04-14 09:01:24', '2026-04-15 15:30:36');

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
  `location_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `user_id`, `hospital_name`, `location`, `contact_phone`, `description`, `verification_status`, `suspended`, `is_verified`, `latitude`, `longitude`, `address`, `location_verified`) VALUES
(1, 4, 'byumba', 'byumba', NULL, NULL, 'approved', 0, 0, NULL, NULL, NULL, 0);

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

--
-- Dumping data for table `hospital_verification`
--

INSERT INTO `hospital_verification` (`id`, `hospital_id`, `license_path`, `registration_number`, `verified_by`, `verified_at`, `status`, `rejection_reason`, `created_at`) VALUES
(1, 1, 'uploads\\licenses\\license-1776161646017-332056503.pdf', NULL, 2, '2026-04-15 11:18:03', 'approved', NULL, '2026-04-13 22:04:58');

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
(1, 2, '2025-01-15 10:00:00', 'https://meet.google.com/xxx', NULL, 'scheduled');

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
(1, 1, 'loboratory', 'make pharmacy trust by user', 'General Practice', 'urban', '65', '2026-04-13 22:08:06', 'open', 1, 0),
(2, 1, 'General Practitioner Needed', 'We need a GP for our clinic in Kigali.', 'General Practice', 'urban', '60k-80k', '2026-04-13 22:26:50', 'open', 1, 0),
(3, 1, 'pharmacy', 'provide clar medecine to sick people', 'General Practice', 'urban', '65', '2026-04-13 23:37:28', 'open', 1, 0),
(4, 1, 'lob', 'make lab excellet', 'General Practice', 'urban', '70', '2026-04-14 10:10:17', 'open', 1, 0),
(5, 1, 'loboratory', 'hardworking', 'General Practice', 'urban', '70', '2026-04-15 15:39:54', 'open', 1, 0),
(7, 1, 'radiology', 'take photo inside body and treat sick people', 'Cardiology', 'urban', '65', '2026-04-18 19:59:01', 'open', 0, 0),
(8, 1, 'surgery', 'support girls', 'Surgery', 'rural', '70', '2026-04-18 20:08:08', 'open', 0, 0);

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
(37, 4, 3, 'hello', 1, '2026-04-18 15:37:56'),
(38, 4, 3, 'hy', 1, '2026-04-18 15:38:06'),
(39, 3, 4, 'hello', 1, '2026-04-18 15:39:01'),
(41, 3, 4, 'hy', 1, '2026-04-18 16:37:58'),
(42, 3, 4, 'as', 1, '2026-04-18 17:37:01'),
(43, 2, 3, 'hello', 1, '2026-04-18 18:03:55'),
(44, 3, 2, 'hy', 1, '2026-04-18 18:04:46'),
(45, 2, 4, 'hello', 1, '2026-04-18 18:08:27'),
(47, 3, 2, 'nones', 0, '2026-04-18 19:53:38');

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
(2, 3, 'New Message', '📬 Message from byumba: \"hello\"', 1, '2026-04-13 22:08:46'),
(11, 4, 'New Message', '📬 Message from TWAHUJUMUTIMA Ildebrande: \"nice\"', 1, '2026-04-13 23:41:35'),
(12, 2, 'hello every one', 'i announce you the meet we get on google met foy every one', 0, '2026-04-13 23:48:35'),
(15, 2, 'met', 'hello', 0, '2026-04-14 07:20:29'),
(18, 2, 'hello', 'greet', 1, '2026-04-14 07:59:59'),
(23, 2, 'hello', 'hello', 0, '2026-04-14 08:38:20'),
(30, 2, 'New Message', '📬 New message from TWAHUJUMUTIMA Ildebrande: \"hy\"', 0, '2026-04-14 10:04:20'),
(31, 2, 'New Message', '📬 New message from TWAHUJUMUTIMA Ildebrande: \"nice\"', 0, '2026-04-14 10:06:20'),
(35, 2, 'meet', 'meeting is tomorrow', 0, '2026-04-15 13:15:49'),
(39, 2, 'New Message', '📬 New message from TWAHUJUMUTIMA Ildebrande: \"hello\"', 0, '2026-04-15 15:31:47'),
(41, 2, 'New Message', '📬 New message from byumba: \"hello\"', 0, '2026-04-15 15:33:20'),
(53, 4, 'New Application', 'TWAHUJUMUTIMA Ildebrande applied for \"lab1\"', 1, '2026-04-17 09:30:11'),
(54, 3, 'Application Update', 'Your application for \"lab1\" was not selected.', 1, '2026-04-17 09:33:44'),
(56, 4, 'google met', 'hello', 1, '2026-04-18 11:28:36'),
(58, 4, 'google met', 'hy', 1, '2026-04-18 11:36:40'),
(75, 3, 'asdcbgfd', 'regfgfds', 1, '2026-04-18 15:11:26'),
(76, 3, 'sfghdjfghfgds', 'asrdfsghjkvlkvjhgg', 1, '2026-04-18 15:22:35'),
(77, 4, 'sfghdjfghfgds', 'asrdfsghjkvlkvjhgg', 1, '2026-04-18 15:22:35'),
(78, 3, 'ureytut', 'tri;uiyrytyuoiiuouy', 1, '2026-04-18 15:39:43'),
(79, 4, 'ureytut', 'tri;uiyrytyuoiiuouy', 1, '2026-04-18 15:39:43'),
(80, 3, '[65eyui[yt', 'opiuytrewrtyui', 1, '2026-04-18 16:06:59'),
(81, 4, '[65eyui[yt', 'opiuytrewrtyui', 1, '2026-04-18 16:07:00'),
(82, 3, 'google met', '\'iuyrewee\n[iuytyuiuytstrerty', 1, '2026-04-18 16:25:42'),
(83, 4, 'google met', '\'iuyrewee\n[iuytyuiuytstrerty', 1, '2026-04-18 16:25:42'),
(84, 3, 'google met', 'asdfddsd', 0, '2026-04-18 17:59:05'),
(85, 4, 'google met', 'asdfddsd', 1, '2026-04-18 17:59:05'),
(86, 3, 'New Job Match', 'A new \"radiology\" position (urban) matching your profile has been posted.', 0, '2026-04-18 19:59:01');

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

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `reporter_id`, `reported_id`, `report_type`, `description`, `status`, `created_at`, `resolved_by`, `resolved_at`) VALUES
(1, 3, 4, 'fake_job', 'Test report for debugging', 'resolved', '2026-04-14 08:46:20', 2, '2026-04-14 08:46:27');

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
(1, 'broadcast', 'Sent to alls: google met', '2026-04-15 18:16:23'),
(2, 'delete_message', 'Deleted message ID 1', '2026-04-15 18:18:57'),
(3, 'delete_message', 'Deleted message ID 3', '2026-04-15 18:19:07'),
(4, 'delete_message', 'Deleted message ID 5', '2026-04-15 18:19:14'),
(5, 'delete_message', 'Deleted message ID 12', '2026-04-15 18:19:18'),
(6, 'delete_message', 'Deleted message ID 18', '2026-04-15 18:19:22'),
(7, 'delete_message', 'Deleted message ID 19', '2026-04-15 18:19:26'),
(8, 'delete_message', 'Deleted message ID 20', '2026-04-15 18:19:31'),
(9, 'delete_message', 'Deleted message ID 17', '2026-04-15 18:19:35'),
(10, 'delete_message', 'Deleted message ID 15', '2026-04-15 18:19:39'),
(11, 'delete_message', 'Deleted message ID 7', '2026-04-15 18:19:43'),
(12, 'backup', 'Created backup file backup_1776277221645.json', '2026-04-15 18:20:21'),
(13, 'backup', 'Created backup file backup_1776277238934.json', '2026-04-15 18:20:38'),
(14, 'cleanup_jobs', 'Deleted 0 old closed jobs', '2026-04-15 18:20:53'),
(15, 'backup', 'Created backup file backup_1776277869107.json', '2026-04-15 18:31:09'),
(16, 'backup', 'Created backup file backup_1776278766308.json', '2026-04-15 18:46:06'),
(17, 'backup', 'Created backup file backup_1776278768109.json', '2026-04-15 18:46:08'),
(18, 'backup', 'Created backup file backup_1776278769283.json', '2026-04-15 18:46:09'),
(19, 'backup', 'Created backup file backup_1776278770261.json', '2026-04-15 18:46:10'),
(20, 'backup', 'Created backup file backup_1776278776526.json', '2026-04-15 18:46:16'),
(21, 'backup', 'Created backup file backup_1776278778042.json', '2026-04-15 18:46:18'),
(22, 'backup', 'Created backup file backup_1776278779542.json', '2026-04-15 18:46:19'),
(23, 'backup', 'Created backup file backup_1776278781256.json', '2026-04-15 18:46:21'),
(24, 'backup', 'Created backup file backup_1776278823393.json', '2026-04-15 18:47:03'),
(25, 'backup', 'Created backup file backup_1776278825150.json', '2026-04-15 18:47:05'),
(26, 'backup', 'Created backup file backup_1776278833997.json', '2026-04-15 18:47:14'),
(27, 'backup', 'Created backup file backup_1776278902899.json', '2026-04-15 18:48:22'),
(28, 'backup', 'Created backup file backup_1776278907873.json', '2026-04-15 18:48:27'),
(29, 'backup', 'Created backup file backup_1776279078076.json', '2026-04-15 18:51:18'),
(30, 'backup', 'Created backup file backup_1776279079133.json', '2026-04-15 18:51:19'),
(31, 'backup', 'Created backup file backup_1776279809538.json', '2026-04-15 19:03:29'),
(32, 'backup', 'Created backup file backup_1776280541854.json', '2026-04-15 19:15:41'),
(33, 'backup', 'Created backup file backup_1776280542823.json', '2026-04-15 19:15:42'),
(34, 'backup', 'Created backup file backup_1776280544354.json', '2026-04-15 19:15:44'),
(35, 'delete_message', 'Deleted message ID 25', '2026-04-18 08:20:04'),
(36, 'delete_message', 'Deleted message ID 24', '2026-04-18 08:20:10'),
(37, 'delete_message', 'Deleted message ID 27', '2026-04-18 08:20:20'),
(38, 'broadcast', 'Sent to alls: google met', '2026-04-18 11:28:36'),
(39, 'cleanup_jobs', 'Deleted 0 old closed jobs', '2026-04-18 11:29:34'),
(40, 'broadcast', 'Sent to alls: google met', '2026-04-18 11:36:40'),
(41, 'broadcast', 'Sent to alls: google met', '2026-04-18 11:37:57'),
(42, 'broadcast', 'Sent to doctors: greet', '2026-04-18 11:46:08'),
(43, 'broadcast', 'Sent to alls: google met', '2026-04-18 12:00:25'),
(44, 'broadcast', 'Sent to alls: google met', '2026-04-18 12:34:10'),
(45, 'delete_message', 'Deleted message ID 31', '2026-04-18 12:34:44'),
(46, 'broadcast', 'Sent to alls: google met', '2026-04-18 12:35:10'),
(47, 'delete_job', 'Deleted job ID 6', '2026-04-18 15:10:58'),
(48, 'broadcast', 'Sent to doctors: asdcbgfd', '2026-04-18 15:11:26'),
(49, 'broadcast', 'Sent to alls: sfghdjfghfgds', '2026-04-18 15:22:36'),
(50, 'broadcast', 'Sent to alls: ureytut', '2026-04-18 15:39:44'),
(51, 'delete_message', 'Deleted message ID 40', '2026-04-18 15:42:00'),
(52, 'broadcast', 'Sent to alls: google met', '2026-04-18 16:25:42'),
(53, 'broadcast', 'Sent to alls: google met', '2026-04-18 17:59:05'),
(54, 'delete_message', 'Deleted message ID 48', '2026-04-18 20:17:08');

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
(2, 'admin@medlink.com', '$2b$10$tBLk9eY7mrZdwMRmIhgPaeMyCQsR7qh3oGVXeMtABYCisjMgbTKZ6', 'admin', 'en', '2026-04-13 21:59:39', 0),
(3, 'ildebrandetwahujumutima@gmail.com', '$2b$12$e/2TzdXSsUFzYoZCJIqOk.kUi9OtImxM7/RGwhlLpLaUeb0Usi.hW', 'doctor', 'en', '2026-04-13 22:02:01', 0),
(4, 'ilidebrandetwahujumutima@gmail.com', '$2b$12$mtDI2baEOjq6ikorewjP.OXcRrQ6lNLQeJp.ysIBRyu1AAmdG18HS', 'hospital', 'en', '2026-04-13 22:04:58', 0);

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
(2, 1, 1, 'dark'),
(3, 1, 1, 'light'),
(4, 1, 1, 'light');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `hospitals`
--
ALTER TABLE `hospitals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `hospital_verification`
--
ALTER TABLE `hospital_verification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviews`
--
ALTER TABLE `interviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- Constraints for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD CONSTRAINT `admin_settings_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `broadcast_messages`
--
ALTER TABLE `broadcast_messages`
  ADD CONSTRAINT `broadcast_messages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `broadcast_receipts`
--
ALTER TABLE `broadcast_receipts`
  ADD CONSTRAINT `broadcast_receipts_ibfk_1` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcast_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `broadcast_receipts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD CONSTRAINT `hospitals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hospital_verification`
--
ALTER TABLE `hospital_verification`
  ADD CONSTRAINT `hospital_verification_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hospital_verification_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `interviews`
--
ALTER TABLE `interviews`
  ADD CONSTRAINT `interviews_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
