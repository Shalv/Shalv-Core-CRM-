-- phpMyAdmin SQL Dump
-- Database: `u571508785_Support_AMS`

CREATE TABLE IF NOT EXISTS `finance_company_setup` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `legal_name` varchar(190) NOT NULL,
  `trade_name` varchar(190) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `pan` varchar(20) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `website` varchar(190) DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `default_tax_rate` decimal(5,2) NOT NULL DEFAULT 18.00,
  `default_sac` varchar(20) DEFAULT NULL,
  `default_payment_terms` varchar(100) DEFAULT '30 Days',
  `proforma_prefix` varchar(20) NOT NULL DEFAULT 'PI-',
  `proforma_next` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `tax_invoice_prefix` varchar(20) NOT NULL DEFAULT 'INV-',
  `purchase_order_prefix` varchar(20) NOT NULL DEFAULT 'PO-',
  `tax_invoice_next` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `purchase_order_next` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_account_name` varchar(190) DEFAULT NULL,
  `bank_account_no` varchar(60) DEFAULT NULL,
  `bank_ifsc` varchar(30) DEFAULT NULL,
  `bank_branch` varchar(120) DEFAULT NULL,
  `terms_conditions` text DEFAULT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `finance_company_setup` (`id`, `legal_name`, `trade_name`, `address`, `city`, `state`, `state_code`, `pincode`, `gstin`, `pan`, `email`, `phone`, `website`, `logo_path`, `currency`, `default_tax_rate`, `default_sac`, `default_payment_terms`, `proforma_prefix`, `proforma_next`, `tax_invoice_prefix`, `purchase_order_prefix`, `tax_invoice_next`, `purchase_order_next`, `bank_name`, `bank_account_name`, `bank_account_no`, `bank_ifsc`, `bank_branch`, `terms_conditions`) VALUES
(1, 'Coreenact Solutions', '', 'Innov8, 3rd Floor, 211', 'Okhla Industrial Estate', 'Delhi', '07', '110020', '07FLTPS4666B1ZI', 'FLTPS4666B', 'infor@coreenact.com', '9810998290', 'www.coreenact.com', '', 'INR', 18.00, '998313', '30 Days', 'CSPI-', 36, 'CSINV-', 'CS/PO/26/03/', 48, 3, 'Bank of Baroda', 'Coreenact Solutions', '71000200001745', 'BARB0DBOKHL', 'Okhla Industrial Phase-3, New Delhi, 110020', 'Payment is due within the credit period agreed in the quotation, purchase order, or agreement.\r\nApplicable GST and other statutory taxes will be charged as per prevailing laws.\r\nAny invoice discrepancy must be reported in writing within 7 days of the invoice date.\r\nCancellation or refund, if applicable, will be subject to the agreed commercial terms.\r\nThis invoice is governed by the applicable laws and jurisdiction of New Delhi.');

CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(30) NOT NULL,
  `company_name` varchar(190) NOT NULL,
  `website` varchar(190) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `contact_name` varchar(140) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `address` text DEFAULT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'India',
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `gst_rule` enum('IGST','CGST + SGST','UTGST') DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `solution` varchar(190) DEFAULT NULL,
  `project_phase` varchar(60) NOT NULL DEFAULT 'Live Support',
  `account_manager_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
);

INSERT INTO `customers` (`id`, `customer_code`, `company_name`, `website`, `industry`, `contact_name`, `email`, `phone`, `address`, `country`, `state`, `city`, `state_code`, `gst_rule`, `pincode`, `gstin`, `solution`, `project_phase`, `account_manager_id`, `status`) VALUES
(1, 'TAJ01', 'Taj computer Solutions Pvt Ltd', '', 'Trading', 'Sawan Pathak', 'sawankumar@tajcomputersolutions.com', '+91 72909 96601', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'India', 'New Delhi', NULL, '07', 'CGST + SGST', '110044', '07AAECT3412A1ZZ', 'MS D Business Central', 'Live Support', 2, 'Active'),
(2, 'IGPL', 'incite Gravity Pvt Ltd', 'https://incitegravity.com/', 'IT', 'Srikant Jena', 'srikant@incitegravity.com', '8290090611', 'EROS CORPORATE PARK, 1023-1024, 10th Floor, Sec-2, IMT, Manesar', 'India', 'Haryana', 'Gurugram', '06', '', '122052', '06AAHCI1841H1ZQ', 'emails', '', 1, 'Active'),
(3, 'BSIPL', 'Build Storys', 'www.buildstorys.com', '', 'Shruthi', 'Shruthi@buildstorys.com', '9819290299', '', 'India', '', NULL, '', NULL, '', '', 'Real Estate', 'Live Support', NULL, 'Active'),
(4, 'EPL', 'Eduvrse Pvt ltd', '', 'Education', 'Eshant Sharma', 'Eshant.sharma@eduvrse.com', '9999100186', '107, Vipul Trade Centre, Sohna - Gurgaon Rd, Sector 48, Gurugram, Haryana 122018', 'India', 'Haryana', NULL, '06', NULL, '122018', '06AAJCE9775G1Z5', 'Education ERP', 'Discovery', 1, 'Active');

CREATE TABLE IF NOT EXISTS `finance_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(40) NOT NULL,
  `invoice_type` enum('Proforma','Tax Invoice','Professional Service Invoice','AMC Invoice','Credit Note','Debit Note','Receipt Voucher') NOT NULL,
  `proforma_invoice_id` bigint(20) UNSIGNED DEFAULT NULL,
  `source_type` enum('AMC Renewal','Change Request','Ticket','Manual','CRM Opportunity') NOT NULL,
  `source_id` int(10) UNSIGNED DEFAULT NULL,
  `billing_component` enum('License','Implementation') DEFAULT NULL,
  `crm_milestone_id` int(10) UNSIGNED DEFAULT NULL,
  `schedule_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ticket_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_id` int(10) UNSIGNED NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `service_period_start` date DEFAULT NULL,
  `service_period_end` date DEFAULT NULL,
  `customer_name` varchar(190) NOT NULL,
  `customer_gstin` varchar(20) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `billing_state` varchar(100) DEFAULT NULL,
  `billing_state_code` varchar(2) DEFAULT NULL,
  `billing_pincode` varchar(10) DEFAULT NULL,
  `place_of_supply` varchar(100) DEFAULT NULL,
  `place_of_supply_code` varchar(2) DEFAULT NULL,
  `supply_type` enum('B2B','B2C') NOT NULL DEFAULT 'B2C',
  `reverse_charge` enum('Yes','No') NOT NULL DEFAULT 'No',
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_terms` varchar(100) DEFAULT NULL,
  `status` enum('Draft','Issued','Partially Paid','Paid','Cancelled') NOT NULL DEFAULT 'Draft',
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `finance_invoices` (`id`, `invoice_no`, `invoice_type`, `proforma_invoice_id`, `source_type`, `source_id`, `billing_component`, `crm_milestone_id`, `schedule_id`, `ticket_id`, `customer_id`, `invoice_date`, `due_date`, `service_period_start`, `service_period_end`, `customer_name`, `customer_gstin`, `billing_address`, `billing_state`, `billing_state_code`, `billing_pincode`, `place_of_supply`, `place_of_supply_code`, `supply_type`, `reverse_charge`, `currency`, `payment_terms`, `status`, `subtotal`, `taxable_amount`, `cgst_amount`, `sgst_amount`, `igst_amount`, `grand_total`, `amount_paid`, `notes`) VALUES
(7, 'CSINV-00035', 'Tax Invoice', NULL, 'AMC Renewal', 4, NULL, NULL, 153, NULL, 1, '2026-09-07', '2026-09-09', '2026-09-08', '2027-09-07', 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', 'New Delhi', '07', 'B2B', 'No', 'INR', '30 Days', 'Paid', 300000.00, 300000.00, 27000.00, 27000.00, 0.00, 354000.00, 354000.00, 'Created from Proforma CSPI-00034'),
(9, 'CSINV-00036', 'Professional Service Invoice', NULL, 'Manual', NULL, NULL, NULL, NULL, NULL, 2, '2026-09-15', '2026-10-17', NULL, NULL, 'incite Gravity Pvt Ltd', '06AAHCI1841H1ZQ', 'EROS CORPORATE PARK, 1023-1024, 10th Floor, Sec-2, IMT, Manesar', 'Haryana', '06', '122052', 'Haryana', '06', 'B2B', 'No', 'INR', '7 Days', 'Partially Paid', 250000.00, 250000.00, 0.00, 0.00, 45000.00, 295000.00, 135000.00, ''),
(10, 'CSINV-00037', 'Proforma', NULL, 'Change Request', 1, NULL, NULL, NULL, 190, 1, '2026-09-24', '2026-10-24', NULL, NULL, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', 'New Delhi', '07', 'B2B', 'No', 'INR', '30 Days', 'Paid', 30000.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00, 35400.00, 'New Report Change Request'),
(11, 'CSINV-00038', 'Tax Invoice', NULL, 'Change Request', 1, NULL, NULL, NULL, 190, 1, '2026-09-25', '2026-10-24', NULL, NULL, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', 'New Delhi', '07', 'B2B', 'No', 'INR', '30 Days', 'Issued', 30000.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00, 0.00, 'Created from Proforma CSINV-00037'),
(12, 'CSINV-00039', 'Tax Invoice', NULL, 'Change Request', 1, NULL, NULL, NULL, 190, 1, '2026-09-28', '2026-10-24', NULL, NULL, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', 'New Delhi', '07', 'B2B', 'No', 'INR', '30 Days', 'Paid', 30000.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00, 35400.00, 'Created from Proforma CSINV-00037'),
(13, 'CSINV-00040', 'Tax Invoice', NULL, 'Manual', NULL, NULL, NULL, NULL, NULL, 4, '2026-09-29', '2026-10-01', NULL, NULL, 'Eduvrse Pvt ltd', '06AAJCE9775G1Z5', '107, Vipul Trade Centre, Sohna - Gurgaon Rd, Sector 48, Gurugram, Haryana 122018', 'Haryana', '06', '122018', 'Haryana', '06', 'B2B', 'No', 'INR', '30 Days', 'Issued', 150000.00, 150000.00, 0.00, 0.00, 27000.00, 177000.00, 0.00, ''),
(15, 'CSINV-00042', 'Tax Invoice', NULL, 'Manual', NULL, NULL, NULL, NULL, NULL, 1, '2026-09-30', '2026-10-01', NULL, NULL, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', 'New Delhi', '07', 'B2B', 'No', 'INR', '30 Days', 'Issued', 48000.00, 48000.00, 4320.00, 4320.00, 0.00, 56640.00, 0.00, ''),
(20, 'CSINV-00047', 'Tax Invoice', NULL, 'Manual', NULL, NULL, NULL, NULL, NULL, 1, '2026-10-06', '2026-10-09', NULL, NULL, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', 'New Delhi', '07', 'B2B', 'No', 'INR', '30 Days', 'Issued', 359340.00, 359340.00, 32340.60, 32340.60, 0.00, 424021.20, 0.00, '');

CREATE TABLE IF NOT EXISTS `finance_invoice_items` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint(20) UNSIGNED NOT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `hsn_sac` varchar(20) DEFAULT NULL,
  `unit` varchar(30) NOT NULL DEFAULT 'Service',
  `quantity` decimal(12,3) NOT NULL DEFAULT 1.000,
  `unit_price` decimal(14,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(6,2) NOT NULL DEFAULT 0.00,
  `tax_percent` decimal(6,2) NOT NULL DEFAULT 18.00,
  `taxable_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
);

INSERT INTO `finance_invoice_items` (`id`, `invoice_id`, `item_name`, `description`, `hsn_sac`, `unit`, `quantity`, `unit_price`, `discount_percent`, `tax_percent`, `taxable_value`, `cgst_amount`, `sgst_amount`, `igst_amount`, `line_total`) VALUES
(7, 7, NULL, 'AMC TAJ-AMC-2026-27 · Renewal', '998313', 'Service', 1.000, 300000.00, 0.00, 18.00, 300000.00, 27000.00, 27000.00, 0.00, 354000.00),
(9, 9, NULL, 'Consultancy', '998313', 'Service', 1.000, 250000.00, 0.00, 18.00, 250000.00, 0.00, 0.00, 45000.00, 295000.00),
(10, 10, NULL, 'CHG-00001 · Reports', '998313', 'Service', 1.000, 30000.00, 0.00, 18.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00),
(11, 11, NULL, 'CHG-00001 · Reports', '998313', 'Service', 1.000, 30000.00, 0.00, 18.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00),
(12, 12, NULL, 'CHG-00001 · Reports', '998313', 'Service', 1.000, 30000.00, 0.00, 18.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00),
(13, 13, NULL, 'Education ERP - School Admin Portal, Student Portal, Parent Portal & Mobile Application', '998313', 'Service', 1.000, 150000.00, 0.00, 18.00, 150000.00, 0.00, 0.00, 27000.00, 177000.00),
(15, 15, NULL, 'Scrap Management form & uploader', '998313', 'Service', 1.000, 48000.00, 0.00, 18.00, 48000.00, 4320.00, 4320.00, 0.00, 56640.00),
(28, 20, NULL, 'Dynamics 365 Business Central Team · Yearly', '997331', 'License', 5.000, 7980.00, 0.00, 18.00, 39900.00, 3591.00, 3591.00, 0.00, 47082.00),
(29, 20, NULL, 'MS D365 Business Central Essential · Yearly', '997331', 'License', 4.000, 79860.00, 0.00, 18.00, 319440.00, 28749.60, 28749.60, 0.00, 376939.20);

CREATE TABLE IF NOT EXISTS `finance_payments` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint(20) UNSIGNED NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_stage` enum('Advance','Balance','Other') NOT NULL DEFAULT 'Other',
  `payment_mode` varchar(50) DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `finance_payments` (`id`, `invoice_id`, `payment_date`, `amount`, `payment_stage`, `payment_mode`, `reference_no`, `notes`) VALUES
(1, 7, '2026-09-08', 347000.00, 'Other', 'Bank Transfer', 'UTR-BOB-99824', 'Part Payment for AMC Invoice CSINV-00035'),
(2, 7, '2026-09-15', 7000.00, 'Balance', 'Bank Transfer', 'UTR-BOB-99890', 'Balance Payment for AMC Invoice CSINV-00035'),
(3, 12, '2026-09-29', 35400.00, 'Other', 'Bank Transfer', 'NEFT-TAJ-7712', 'Full payment for CR Invoice CSINV-00039'),
(4, 10, '2026-09-29', 35400.00, 'Other', 'Bank Transfer', 'NEFT-TAJ-7713', 'Full payment for Proforma CSINV-00037'),
(5, 9, '2026-09-29', 135000.00, 'Other', 'Bank Transfer', 'RTGS-IGPL-5541', 'Advance payment for Consultancy CSINV-00036');

CREATE TABLE IF NOT EXISTS `finance_license_types` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(190) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `hsn_sac` varchar(20) NOT NULL DEFAULT '997331',
  `monthly_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `yearly_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
);

INSERT INTO `finance_license_types` (`id`, `code`, `name`, `description`, `hsn_sac`, `monthly_cost`, `yearly_cost`, `status`) VALUES
(1, 'BC ESSENTIAL', 'MS D365 Business Central Essential', '', '997331', 6655.00, 79860.00, 'Active'),
(2, 'BC- DEVICE', 'Dynamics 365 Business Central Device', '', '997331', 3780.00, 45360.00, 'Active'),
(3, 'DYNAMICS 365 BUSINESS CENTRAL TEAM', 'Dynamics 365 Business Central Team', '', '997331', 665.00, 7980.00, 'Active'),
(4, 'M365-BASIC', 'Microsoft 365 Business Basic', 'Microsoft 365 Business Basic annual license', '997331', 170.00, 2040.00, 'Active');

CREATE TABLE IF NOT EXISTS `finance_purchase_orders` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `po_no` varchar(40) NOT NULL,
  `po_date` date NOT NULL,
  `expected_date` date DEFAULT NULL,
  `supplier_customer_id` int(10) UNSIGNED DEFAULT NULL,
  `supplier_name` varchar(190) NOT NULL,
  `supplier_gstin` varchar(20) DEFAULT NULL,
  `supplier_address` text DEFAULT NULL,
  `supplier_state` varchar(100) DEFAULT NULL,
  `supplier_state_code` varchar(2) DEFAULT NULL,
  `supplier_pincode` varchar(10) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_terms` varchar(100) DEFAULT NULL,
  `status` enum('Draft','Pending Approval','Approved','Cancelled') NOT NULL DEFAULT 'Draft',
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
);

INSERT INTO `finance_purchase_orders` (`id`, `po_no`, `po_date`, `expected_date`, `supplier_customer_id`, `supplier_name`, `supplier_gstin`, `supplier_address`, `supplier_state`, `supplier_state_code`, `supplier_pincode`, `currency`, `payment_terms`, `status`, `subtotal`, `taxable_amount`, `igst_amount`, `grand_total`) VALUES
(1, 'PO-00001', '2026-10-05', '2026-10-06', 2, 'incite Gravity Pvt Ltd', '06AAHCI1841H1ZQ', 'EROS CORPORATE PARK, 1023-1024, 10th Floor, Sec-2, IMT, Manesar', 'Haryana', '06', '122052', 'INR', '30 Days', 'Approved', 4080.00, 4080.00, 734.40, 4814.40);
