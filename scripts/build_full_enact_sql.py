import os

sql_header = """-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 06, 2026 at 10:52 AM
-- Server version: 11.8.9-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `u571508785_enact360_crm_`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Super Admin','Sales Manager','Sales Executive','Customer Success Manager') NOT NULL DEFAULT 'Sales Executive',
  `phone` varchar(30) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `department_id`, `status`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Shalv Sharma', 'admin@coreenact.com', '$2y$10$/B1jr1f/awpWZk98JG8HY.GNGCSQXQBueu6oO82Pe9ug8TeH6w9gO', 'Super Admin', '9810998290', 'uploads/profile/1/f587b00e1fb0c38c33136eeaf70cad19.jpg', NULL, 'Active', '2026-10-06 10:16:51', '2026-09-02 15:43:31', '2026-10-06 10:16:51');

CREATE TABLE IF NOT EXISTS `products` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_code` varchar(40) NOT NULL,
  `name` varchar(190) NOT NULL,
  `family` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `hsn_sac` varchar(30) DEFAULT NULL,
  `list_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percent` decimal(6,2) NOT NULL DEFAULT 18.00,
  `unit` varchar(40) NOT NULL DEFAULT 'Each',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_code` (`product_code`)
);

INSERT INTO `products` (`id`, `product_code`, `name`, `family`, `description`, `hsn_sac`, `list_price`, `cost_price`, `tax_percent`, `unit`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'D365', 'MS D365 Business Central', 'D365 BC', '', '', 1500000.00, 1500000.00, 18.00, 'Each', 1, 1, '2026-09-24 10:42:35', '2026-09-24 10:45:37'),
(2, 'HRMS', 'ENACT Chakra', 'HRMS', '', '', 500000.00, 500000.00, 18.00, 'Each', 1, 1, '2026-09-24 10:43:25', '2026-09-24 10:45:19'),
(3, 'CRM', 'ENACT360', 'CRM', '', '', 500000.00, 500000.00, 18.00, 'Each', 1, 1, '2026-09-24 10:44:03', '2026-09-24 10:45:28'),
(4, 'Support', 'ENACTSupport', 'Support', '', '', 450000.00, 450000.00, 18.00, '400 hrs', 1, 1, '2026-09-24 10:45:05', '2026-09-24 10:45:05');

CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(30) NOT NULL,
  `company_name` varchar(190) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `contact_name` varchar(140) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `address` text DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `solution` varchar(190) DEFAULT NULL,
  `project_phase` enum('Kickoff','Implementation','UAT','Go-Live','Live Support','On Hold','Completed') NOT NULL DEFAULT 'Kickoff',
  `project_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `project_progress` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `account_manager_id` int(10) UNSIGNED DEFAULT NULL,
  `source_lead_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`)
);

INSERT INTO `customers` (`id`, `customer_code`, `company_name`, `industry`, `contact_name`, `email`, `phone`, `address`, `state`, `state_code`, `pincode`, `gstin`, `solution`, `project_phase`, `project_value`, `project_progress`, `account_manager_id`, `source_lead_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'CUS-2026-473740', 'Build Storys Pvt Ltd', 'Real Estate', 'Shruthi', 'shruthi@buildstorys.com', '97403 82382', 'Building No.2122/5 , 1st floor ,\\r\\n2nd main road , D block , opposite to BSNLTelephone Exchange , Sahakarnagar , Bengaluru, 560092', '', '', '', '', 'Ai Based application for their operation along CRM & HRMS', 'Kickoff', 1800000.00, 0, 1, 641, 'Active', '2026-09-19 17:28:27', '2026-09-19 17:31:07'),
(2, 'CUS-2026-791939', 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD', 'Manufacturing', 'Jiten', 'jitengoyal@rrgg.in', '9878681000', 'G.T.Road, Khanna Side, Mandi Gobindgarh, Punjab', 'Punjab', '03', '', '', '', 'Kickoff', 1650000.00, 0, 1, 643, 'Active', '2026-09-19 17:30:12', '2026-09-28 04:13:53'),
(3, 'CUS-2026-586749', 'Eduvrse Pvt ltd', 'Education', 'Eshant Sharma', 'eshant.sharma@eduvrse.com', '9999100186', '107, Vipul Trade Centre, Sohna - Gurgaon Rd, Sector 48, Gurugram, Haryana 122018', NULL, NULL, NULL, NULL, '', 'Kickoff', 1200000.00, 0, 1, 640, 'Active', '2026-09-21 05:19:53', '2026-09-29 13:00:15'),
(4, 'CUS-2026-390234', 'SS Steel Industry', 'Manufacturing', 'Ankur Goyal', 'info@sssteelindustry.com', '98147 55580', '', NULL, NULL, NULL, NULL, '', 'Kickoff', 1500000.00, 0, 1, 644, 'Active', '2026-09-22 08:23:17', '2026-09-28 04:15:35');

CREATE TABLE IF NOT EXISTS `contacts` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `contact_no` varchar(30) NOT NULL,
  `customer_id` int(10) UNSIGNED DEFAULT NULL,
  `lead_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `title` varchar(120) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `mailing_address` text DEFAULT NULL,
  `source` varchar(80) NOT NULL DEFAULT 'Manual',
  `status` enum('Active','Inactive','Do Not Contact') NOT NULL DEFAULT 'Active',
  `owner_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `contact_no` (`contact_no`)
);

INSERT INTO `contacts` (`id`, `contact_no`, `customer_id`, `lead_id`, `first_name`, `last_name`, `title`, `department`, `email`, `phone`, `mobile`, `linkedin`, `mailing_address`, `source`, `status`, `owner_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'CON-2026-559003', NULL, 639, 'Yuvraj', 'Jain', 'Management Merchandiser', '', 'yuvraj@ratantextiles.com', '9950285767', '9950285767', '', 'F200-201, E.P.I.P., SITAPURA, SANGANER, JAIPUR RAJASTHAN, 302022', 'Lead', 'Active', 1, 1, '2026-09-14 07:02:37', '2026-09-14 07:02:37'),
(2, 'CON-2026-109952', 3, 640, 'Eshant', 'Sharma', 'Founder', '', 'eshant.sharma@eduvrse.com', '9999100186', '9999100186', '', '', 'Lead', 'Active', 1, 1, '2026-09-15 04:15:51', '2026-09-21 05:19:53'),
(3, 'CON-2026-527329', 1, 641, 'Shruthi', '-', 'Founder', '', 'shruthi@buildstorys.com', '97403 82382', '97403 82382', '', 'Building No.2122/5 , 1st floor ,\\r\\n2nd main road , D block , opposite to BSNLTelephone Exchange , Sahakarnagar , Bengaluru, 560092', 'Lead', 'Active', 1, 1, '2026-09-15 04:23:02', '2026-09-19 17:28:27'),
(4, 'CON-2026-646435', NULL, 642, 'Sawan', 'Pathak', 'Finance Head', '', 'sawankumar@tajcomputers.com', '7290996601', '7290996601', '', '', 'Lead', 'Active', NULL, 1, '2026-09-15 04:24:37', '2026-09-15 04:24:37'),
(5, 'CON-2026-364107', 2, 643, 'Jiten', '-', 'Director', '', 'jitengoyal@rrgg.in', '9878681000', '9878681000', '', 'G.T.Road, Khanna Side, Mandi Gobindgarh, Punjab', 'Lead', 'Active', 1, 1, '2026-09-15 04:27:21', '2026-09-19 17:30:12'),
(6, 'CON-2026-949697', 4, 644, 'Ankur', 'Goyal', 'Director', '', 'info@sssteelindustry.com', '98147 55580', '98147 55580', '', '', 'Lead', 'Active', 1, 1, '2026-09-15 05:24:15', '2026-09-22 08:23:17'),
(7, 'CON-2026-975073', NULL, 645, 'Rakesh', '-', 'Director', 'Management', '', '98140 16229', '98140 16229', '', '', 'Lead', 'Active', NULL, 1, '2026-09-28 10:34:15', '2026-09-28 10:34:15');

CREATE TABLE IF NOT EXISTS `sales_orders` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` varchar(40) NOT NULL,
  `order_date` date NOT NULL,
  `customer_id` int(10) UNSIGNED NOT NULL,
  `customer_name` varchar(190) NOT NULL,
  `customer_gstin` varchar(20) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `billing_state` varchar(100) DEFAULT NULL,
  `billing_state_code` varchar(2) DEFAULT NULL,
  `billing_pincode` varchar(10) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `place_of_supply` varchar(120) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_terms` varchar(120) DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('Draft','Confirmed','Partially Fulfilled','Fulfilled','Cancelled') NOT NULL DEFAULT 'Draft',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cess_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `owner_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`)
);

INSERT INTO `sales_orders` (`id`, `order_no`, `order_date`, `customer_id`, `customer_name`, `customer_gstin`, `billing_address`, `billing_state`, `billing_state_code`, `billing_pincode`, `shipping_address`, `place_of_supply`, `currency`, `payment_terms`, `expected_delivery_date`, `status`, `subtotal`, `discount_amount`, `taxable_amount`, `cgst_amount`, `sgst_amount`, `igst_amount`, `cess_amount`, `grand_total`, `notes`, `owner_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'SO/2026-27/00001', '2026-10-05', 2, 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD', NULL, 'G.T.Road, Khanna Side, Mandi Gobindgarh, Punjab', 'Punjab', '03', NULL, 'G.T.Road, Khanna Side, Mandi Gobindgarh, Punjab', 'Punjab (03)', 'INR', '30 Days', NULL, 'Draft', 1500150.00, 0.00, 1500150.00, 0.00, 0.00, 270027.00, 0.00, 1770177.00, '', 1, 1, '2026-10-05 05:28:13', '2026-10-05 05:28:13');

CREATE TABLE IF NOT EXISTS `sales_order_items` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `sales_order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `product_code` varchar(40) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `hsn_sac` varchar(30) DEFAULT NULL,
  `unit` varchar(40) NOT NULL DEFAULT 'Each',
  `quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(6,2) NOT NULL DEFAULT 0.00,
  `tax_percent` decimal(6,2) NOT NULL DEFAULT 18.00,
  `taxable_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cess_percent` decimal(6,2) NOT NULL DEFAULT 0.00,
  `cess_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

INSERT INTO `sales_order_items` (`id`, `sales_order_id`, `product_id`, `product_code`, `description`, `hsn_sac`, `unit`, `quantity`, `unit_price`, `discount_percent`, `tax_percent`, `taxable_value`, `cgst_amount`, `sgst_amount`, `igst_amount`, `cess_percent`, `cess_amount`, `line_total`, `created_at`) VALUES
(1, 1, 1, 'D365', 'MS D365 Business Central', '', 'Each', 1.00, 1500000.00, 0.00, 18.00, 1500150.00, 0.00, 0.00, 270027.00, 0.00, 0.00, 1770177.00, '2026-10-05 05:28:13');

CREATE TABLE IF NOT EXISTS `opportunity_payment_milestones` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lead_id` int(10) UNSIGNED NOT NULL,
  `customer_id` int(10) UNSIGNED DEFAULT NULL,
  `schedule_type` enum('License','Implementation') NOT NULL DEFAULT 'Implementation',
  `milestone_name` enum('Advance','FRD','Development','UAT','Go-live') NOT NULL,
  `sequence_no` tinyint(3) UNSIGNED NOT NULL,
  `percentage` decimal(6,2) NOT NULL DEFAULT 0.00,
  `milestone_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `due_date` date DEFAULT NULL,
  `status` enum('Planned','Due','Partially Paid','Paid','Waived') NOT NULL DEFAULT 'Planned',
  `amount_received` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_date` date DEFAULT NULL,
  `payment_reference` varchar(120) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);

INSERT INTO `opportunity_payment_milestones` (`id`, `lead_id`, `customer_id`, `schedule_type`, `milestone_name`, `sequence_no`, `percentage`, `milestone_amount`, `due_date`, `status`, `amount_received`, `payment_date`, `payment_reference`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 640, 3, 'License', 'Advance', 1, 100.00, 0.00, NULL, 'Paid', 0.00, NULL, NULL, NULL, 1, 1, '2026-09-28 05:45:14', '2026-09-29 12:57:10'),
(2, 640, 3, 'Implementation', 'Advance', 1, 12.50, 150000.00, NULL, 'Planned', 0.00, NULL, NULL, NULL, 1, 1, '2026-09-28 05:45:14', '2026-09-29 12:58:25'),
(3, 640, 3, 'Implementation', 'FRD', 2, 20.00, 240000.00, NULL, 'Planned', 0.00, NULL, NULL, NULL, 1, 1, '2026-09-28 05:45:14', '2026-09-29 12:58:25'),
(4, 640, 3, 'Implementation', 'Development', 3, 37.50, 450000.00, NULL, 'Planned', 0.00, NULL, NULL, NULL, 1, 1, '2026-09-28 05:45:14', '2026-09-29 12:58:25'),
(5, 640, 3, 'Implementation', 'UAT', 4, 20.00, 240000.00, NULL, 'Planned', 0.00, NULL, NULL, NULL, 1, 1, '2026-09-28 05:45:14', '2026-09-29 12:58:25'),
(6, 640, 3, 'Implementation', 'Go-live', 5, 10.00, 120000.00, NULL, 'Planned', 0.00, NULL, NULL, NULL, 1, 1, '2026-09-28 05:45:14', '2026-09-29 12:58:25');

CREATE TABLE IF NOT EXISTS `activities` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lead_id` int(10) UNSIGNED DEFAULT NULL,
  `customer_id` int(10) UNSIGNED DEFAULT NULL,
  `type` enum('Call','Meeting','Demo','Email','Task','Visit','Follow-up') NOT NULL DEFAULT 'Follow-up',
  `subject` varchar(190) NOT NULL,
  `description` text DEFAULT NULL,
  `due_at` datetime NOT NULL,
  `status` enum('Scheduled','Completed','Cancelled','Overdue') NOT NULL DEFAULT 'Scheduled',
  `priority` enum('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `owner_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);

INSERT INTO `activities` (`id`, `lead_id`, `customer_id`, `type`, `subject`, `description`, `due_at`, `status`, `priority`, `owner_id`, `created_by`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 639, NULL, 'Meeting', 'Meeting for Digitalization', 'Meeting With yuvraj Jain', '2026-09-15 11:00:00', 'Scheduled', 'Medium', 1, 1, NULL, '2026-09-14 07:03:28', '2026-09-14 07:03:28'),
(2, 256, NULL, 'Meeting', 'test', 'test', '2026-09-11 11:30:00', 'Completed', 'Medium', 1, 1, '2026-09-16 05:05:46', '2026-09-16 05:05:25', '2026-09-16 05:05:46');

CREATE TABLE IF NOT EXISTS `sales_timeline` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lead_id` int(10) UNSIGNED NOT NULL,
  `entry_type` enum('Remark','Call','Email','Meeting','Follow-up','Status Update','Other') NOT NULL DEFAULT 'Remark',
  `remarks` text NOT NULL,
  `conversation_at` datetime NOT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

INSERT INTO `sales_timeline` (`id`, `lead_id`, `entry_type`, `remarks`, `conversation_at`, `follow_up_at`, `created_by`, `created_at`) VALUES
(1, 639, 'Remark', 'Call with Sunit jain he shared yuvraj jain number for the meeting & discussion for Digitalization', '2026-09-14 12:33:00', '2026-09-15 11:00:00', 1, '2026-09-14 07:04:21'),
(2, 644, 'Follow-up', 'Follow up for next stage', '2026-09-25 10:47:00', '2026-09-30 10:47:00', 1, '2026-09-28 04:18:16');

CREATE TABLE IF NOT EXISTS `opportunity_stage_updates` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lead_id` int(10) UNSIGNED NOT NULL,
  `pipeline_stage` varchar(40) NOT NULL,
  `status_reason` varchar(40) NOT NULL,
  `probability` tinyint(3) UNSIGNED NOT NULL DEFAULT 10,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `expected_close_date` date DEFAULT NULL,
  `next_step` varchar(190) DEFAULT NULL,
  `decision_maker` varchar(190) DEFAULT NULL,
  `competitor` varchar(190) DEFAULT NULL,
  `loss_reason` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

INSERT INTO `opportunity_stage_updates` (`id`, `lead_id`, `pipeline_stage`, `status_reason`, `probability`, `amount`, `expected_close_date`, `next_step`, `decision_maker`, `competitor`, `loss_reason`, `note`, `created_by`, `created_at`) VALUES
(1, 639, 'Qualify', 'Qualified', 25, 0.00, NULL, 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead converted to an opportunity using the Qualify action.', 1, '2026-09-14 07:02:41'),
(2, 640, 'Qualify', 'Qualified', 25, 450000.00, '2027-01-29', 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead automatically converted to an opportunity after qualification.', 1, '2026-09-15 04:15:51'),
(3, 641, 'Qualify', 'Qualified', 25, 1200000.00, '2027-01-27', 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead automatically converted to an opportunity after qualification.', 1, '2026-09-15 04:23:02'),
(4, 642, 'Qualify', 'Qualified', 25, 1700000.00, '2027-03-30', 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead automatically converted to an opportunity after qualification.', 1, '2026-09-15 04:24:37'),
(5, 643, 'Qualify', 'Qualified', 25, 2200000.00, NULL, 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead automatically converted to an opportunity after qualification.', 1, '2026-09-15 04:27:21'),
(6, 644, 'Qualify', 'Qualified', 25, 500000.00, NULL, 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead automatically converted to an opportunity after qualification.', 1, '2026-09-15 05:24:15'),
(7, 643, 'Develop', 'Meeting', 40, 2200000.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-15 05:36:38'),
(8, 644, 'Propose', 'Negotiation', 80, 500000.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-15 05:36:52'),
(9, 641, 'Develop', 'Meeting', 40, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-15 05:37:04'),
(10, 640, 'Propose', 'Proposal', 65, 450000.00, '2027-01-29', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-15 05:37:10'),
(11, 641, 'Propose', 'Proposal', 65, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-15 05:37:20'),
(12, 256, 'Qualify', 'Qualified', 25, 0.00, NULL, 'Complete discovery and confirm stakeholders', NULL, NULL, NULL, 'Lead converted to an opportunity using the Qualify action.', 1, '2026-09-16 05:04:12'),
(13, 256, 'Develop', 'Meeting', 40, 0.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-16 05:04:39'),
(14, 641, 'Close', 'Won', 100, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-19 17:28:27'),
(15, 643, 'Close', 'Won', 100, 2200000.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-19 17:30:12'),
(16, 256, 'Close', 'Deferred', 10, 0.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-19 17:30:28'),
(17, 640, 'Close', 'Won', 100, 450000.00, '2027-01-29', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-21 05:19:53'),
(18, 644, 'Close', 'Won', 100, 500000.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-22 08:23:17'),
(19, 641, 'Develop', 'Meeting', 40, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-22 08:44:58'),
(20, 641, 'Close', 'Won', 100, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-22 08:45:04'),
(21, 641, 'Propose', 'Negotiation', 80, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-22 08:45:26'),
(22, 641, 'Close', 'Won', 100, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-22 08:45:33'),
(23, 641, 'Propose', 'Negotiation', 80, 1200000.00, '2027-01-27', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-28 04:03:14'),
(24, 644, 'Propose', 'Negotiation', 80, 500000.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-28 04:03:20'),
(25, 640, 'Propose', 'Negotiation', 80, 450000.00, '2027-01-29', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-28 04:03:39'),
(26, 643, 'Propose', 'Negotiation', 80, 2200000.00, NULL, 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-28 04:03:44'),
(27, 640, 'Close', 'Won', 100, 1250000.00, '2027-01-29', 'Update next activity from opportunity workspace', NULL, NULL, NULL, 'Stage changed directly from opportunity card.', 1, '2026-09-29 04:45:25');

CREATE TABLE IF NOT EXISTS `leads` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lead_no` varchar(30) NOT NULL,
  `company_name` varchar(190) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `website` varchar(190) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contact_name` varchar(140) NOT NULL,
  `designation` varchar(120) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `source` varchar(80) NOT NULL DEFAULT 'Website',
  `status` enum('New','Contact','Contacted','Qualified','Meeting','Demo','Proposal','Negotiation','Won','Lost','Deferred','Unqualified') NOT NULL DEFAULT 'New',
  `rating` enum('Hot','Warm','Cold') NOT NULL DEFAULT 'Warm',
  `score` tinyint(3) UNSIGNED NOT NULL DEFAULT 50,
  `estimated_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `expected_go_live` date DEFAULT NULL,
  `requirement` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `owner_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `won_at` datetime DEFAULT NULL,
  `lost_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_no` (`lead_no`)
);
"""

with open('/enact360_crm_.sql', 'w') as f:
    f.write(sql_header)

print("enact360_crm_.sql initialized.")
