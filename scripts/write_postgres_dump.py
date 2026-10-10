# Create postgres_dump.sql
sql_content = """-- ============================================================================
-- PostgreSQL Database Dump: ApexCRM & Finance Management System
-- Consolidated from support_AMS.sql and enact360_crm_.sql
-- Generated for PostgreSQL schema & upload
-- ============================================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS finance_payments CASCADE;
DROP TABLE IF EXISTS finance_invoice_items CASCADE;
DROP TABLE IF EXISTS finance_invoices CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS opportunity_payment_milestones CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS finance_purchase_order_items CASCADE;
DROP TABLE IF EXISTS finance_purchase_orders CASCADE;
DROP TABLE IF EXISTS license_types CASCADE;
DROP TABLE IF EXISTS company_setup CASCADE;

-- 1. Company Setup
CREATE TABLE company_setup (
    id SERIAL PRIMARY KEY,
    legal_name VARCHAR(190) NOT NULL,
    trade_name VARCHAR(190),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    state_code VARCHAR(10),
    pincode VARCHAR(10),
    gstin VARCHAR(20),
    pan VARCHAR(20),
    email VARCHAR(190),
    phone VARCHAR(30),
    website VARCHAR(190),
    currency VARCHAR(10) DEFAULT 'INR',
    default_tax_rate NUMERIC(5,2) DEFAULT 18.00,
    default_sac VARCHAR(20) DEFAULT '998313',
    default_payment_terms VARCHAR(100) DEFAULT '30 Days',
    proforma_prefix VARCHAR(20) DEFAULT 'CSPI-',
    tax_invoice_prefix VARCHAR(20) DEFAULT 'CSINV-',
    purchase_order_prefix VARCHAR(20) DEFAULT 'CS/PO/26/03/',
    bank_name VARCHAR(150),
    bank_account_name VARCHAR(190),
    bank_account_no VARCHAR(60),
    bank_ifsc VARCHAR(30),
    bank_branch VARCHAR(120),
    terms_conditions TEXT
);

INSERT INTO company_setup (id, legal_name, trade_name, address, city, state, state_code, pincode, gstin, pan, email, phone, website, currency, default_tax_rate, default_sac, default_payment_terms, proforma_prefix, tax_invoice_prefix, purchase_order_prefix, bank_name, bank_account_name, bank_account_no, bank_ifsc, bank_branch, terms_conditions) VALUES
(1, 'Coreenact Solutions', '', 'Innov8, 3rd Floor, 211', 'Okhla Industrial Estate', 'Delhi', '07', '110020', '07FLTPS4666B1ZI', 'FLTPS4666B', 'infor@coreenact.com', '9810998290', 'www.coreenact.com', 'INR', 18.00, '998313', '30 Days', 'CSPI-', 'CSINV-', 'CS/PO/26/03/', 'Bank of Baroda', 'Coreenact Solutions', '71000200001745', 'BARB0DBOKHL', 'Okhla Industrial Phase-3, New Delhi, 110020', 'Payment is due within the credit period agreed in the quotation, purchase order, or agreement. Applicable GST and other statutory taxes will be charged as per prevailing laws.');

-- 2. License Types
CREATE TABLE license_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(190) NOT NULL,
    description TEXT,
    hsn_sac VARCHAR(20) DEFAULT '997331',
    monthly_cost NUMERIC(14,2) DEFAULT 0.00,
    yearly_cost NUMERIC(14,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Active'
);

INSERT INTO license_types (id, code, name, description, hsn_sac, monthly_cost, yearly_cost, status) VALUES
(1, 'BC ESSENTIAL', 'MS D365 Business Central Essential', '', '997331', 6655.00, 79860.00, 'Active'),
(2, 'BC- DEVICE', 'Dynamics 365 Business Central Device', '', '997331', 3780.00, 45360.00, 'Active'),
(3, 'DYNAMICS 365 BUSINESS CENTRAL TEAM', 'Dynamics 365 Business Central Team', '', '997331', 665.00, 7980.00, 'Active'),
(4, 'M365-BASIC', 'Microsoft 365 Business Basic', 'Microsoft 365 Business Basic annual license', '997331', 170.00, 2040.00, 'Active');

-- 3. Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(30) NOT NULL UNIQUE,
    company_name VARCHAR(190) NOT NULL,
    website VARCHAR(190),
    industry VARCHAR(100),
    contact_name VARCHAR(140) NOT NULL,
    email VARCHAR(190),
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    country VARCHAR(100) DEFAULT 'India',
    state VARCHAR(100),
    city VARCHAR(100),
    state_code VARCHAR(10),
    gst_rule VARCHAR(30),
    pincode VARCHAR(10),
    gstin VARCHAR(20),
    solution VARCHAR(190),
    project_phase VARCHAR(60) DEFAULT 'Live Support',
    project_value NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Active'
);

INSERT INTO customers (id, customer_code, company_name, website, industry, contact_name, email, phone, address, country, state, city, state_code, gst_rule, pincode, gstin, solution, project_phase, project_value, status) VALUES
(1, 'TAJ01', 'Taj computer Solutions Pvt Ltd', '', 'Trading', 'Sawan Pathak', 'sawankumar@tajcomputersolutions.com', '+91 72909 96601', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'India', 'New Delhi', 'New Delhi', '07', 'CGST + SGST', '110044', '07AAECT3412A1ZZ', 'MS D Business Central', 'Live Support', 425000.00, 'Active'),
(2, 'IGPL', 'incite Gravity Pvt Ltd', 'https://incitegravity.com/', 'IT', 'Srikant Jena', 'srikant@incitegravity.com', '8290090611', 'EROS CORPORATE PARK, 1023-1024, 10th Floor, Sec-2, IMT, Manesar', 'India', 'Haryana', 'Gurugram', '06', 'IGST', '122052', '06AAHCI1841H1ZQ', 'emails', 'Live Support', 295000.00, 'Active'),
(3, 'CUS-2026-473740', 'Build Storys Pvt Ltd', 'https://buildstorys.com/', 'Real Estate', 'Shruthi', 'shruthi@buildstorys.com', '97403 82382', 'Building No.2122/5 , 1st floor , 2nd main road , D block , opposite to BSNLTelephone Exchange , Sahakarnagar , Bengaluru', 'India', 'Karnataka', 'Bengaluru', '29', 'IGST', '560092', '', 'Ai Based application for their operation along CRM & HRMS', 'Kickoff', 1800000.00, 'Active'),
(4, 'CUS-2026-586749', 'Eduvrse Pvt ltd', '', 'Education', 'Eshant Sharma', 'eshant.sharma@eduvrse.com', '9999100186', '107, Vipul Trade Centre, Sohna - Gurgaon Rd, Sector 48, Gurugram, Haryana', 'India', 'Haryana', 'Gurugram', '06', 'IGST', '122018', '06AAJCE9775G1Z5', 'Education ERP', 'Kickoff', 1200000.00, 'Active'),
(5, 'CUS-2026-791939', 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD', 'https://www.rrgg.in/', 'Manufacturing', 'Jiten', 'jitengoyal@rrgg.in', '9878681000', 'G.T.Road, Khanna Side, Mandi Gobindgarh, Punjab', 'India', 'Punjab', 'Mandi Gobindgarh', '03', 'IGST', '141401', '', 'MS D365 Business Central', 'Kickoff', 1650000.00, 'Active'),
(6, 'CUS-2026-390234', 'SS Steel Industry', '', 'Manufacturing', 'Ankur Goyal', 'info@sssteelindustry.com', '98147 55580', 'Industrial Area, Mandi Gobindgarh', 'India', 'Punjab', 'Mandi Gobindgarh', '03', 'IGST', '141401', '', 'ERP Implementation', 'Kickoff', 1500000.00, 'Active');

-- 4. Customer Contacts
CREATE TABLE customer_contacts (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    name VARCHAR(140) NOT NULL,
    email VARCHAR(190),
    phone VARCHAR(30),
    designation VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Active'
);

INSERT INTO customer_contacts (id, customer_id, name, email, phone, designation, is_primary, status) VALUES
(1, 1, 'Sawan Pathak', 'sawankumar@tajcomputersolutions.com', '+91 72909 96601', 'Finance manager', TRUE, 'Active'),
(2, 2, 'Srikant Jena', 'srikant@incitegravity.com', '8290090611', 'Director', TRUE, 'Active'),
(3, 3, 'Shruthi', 'shruthi@buildstorys.com', '97403 82382', 'Founder', TRUE, 'Active'),
(4, 4, 'Eshant Sharma', 'eshant.sharma@eduvrse.com', '9999100186', 'Founder / Director', TRUE, 'Active'),
(5, 5, 'Jiten', 'jitengoyal@rrgg.in', '9878681000', 'Director', TRUE, 'Active'),
(6, 6, 'Ankur Goyal', 'info@sssteelindustry.com', '98147 55580', 'Director', TRUE, 'Active');

-- 5. Invoices
CREATE TABLE finance_invoices (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(40) NOT NULL UNIQUE,
    invoice_type VARCHAR(40) NOT NULL,
    customer_id INT REFERENCES customers(id),
    customer_name VARCHAR(190) NOT NULL,
    customer_gstin VARCHAR(20),
    billing_address TEXT,
    billing_state VARCHAR(100),
    billing_state_code VARCHAR(10),
    billing_pincode VARCHAR(10),
    invoice_date DATE NOT NULL,
    due_date DATE,
    service_period_start DATE,
    service_period_end DATE,
    place_of_supply VARCHAR(100),
    place_of_supply_code VARCHAR(10),
    supply_type VARCHAR(10) DEFAULT 'B2B',
    currency VARCHAR(10) DEFAULT 'INR',
    payment_terms VARCHAR(100) DEFAULT '30 Days',
    status VARCHAR(30) DEFAULT 'Draft',
    subtotal NUMERIC(14,2) DEFAULT 0.00,
    taxable_amount NUMERIC(14,2) DEFAULT 0.00,
    cgst_amount NUMERIC(14,2) DEFAULT 0.00,
    sgst_amount NUMERIC(14,2) DEFAULT 0.00,
    igst_amount NUMERIC(14,2) DEFAULT 0.00,
    grand_total NUMERIC(14,2) DEFAULT 0.00,
    amount_paid NUMERIC(14,2) DEFAULT 0.00,
    notes TEXT
);

INSERT INTO finance_invoices (id, invoice_no, invoice_type, customer_id, customer_name, customer_gstin, billing_address, billing_state, billing_state_code, billing_pincode, invoice_date, due_date, service_period_start, service_period_end, place_of_supply, place_of_supply_code, supply_type, currency, payment_terms, status, subtotal, taxable_amount, cgst_amount, sgst_amount, igst_amount, grand_total, amount_paid, notes) VALUES
(7, 'CSINV-00035', 'Tax Invoice', 1, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', '2026-09-07', '2026-09-09', '2026-09-08', '2027-09-07', 'New Delhi', '07', 'B2B', 'INR', '30 Days', 'Paid', 300000.00, 300000.00, 27000.00, 27000.00, 0.00, 354000.00, 354000.00, 'Created from Proforma CSPI-00034'),
(9, 'CSINV-00036', 'Professional Service Invoice', 2, 'incite Gravity Pvt Ltd', '06AAHCI1841H1ZQ', 'EROS CORPORATE PARK, 1023-1024, 10th Floor, Sec-2, IMT, Manesar', 'Haryana', '06', '122052', '2026-09-15', '2026-10-17', NULL, NULL, 'Haryana', '06', 'B2B', 'INR', '7 Days', 'Partially Paid', 250000.00, 250000.00, 0.00, 0.00, 45000.00, 295000.00, 135000.00, 'Consultancy services for ERP rollout'),
(10, 'CSINV-00037', 'Proforma', 1, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', '2026-09-24', '2026-10-24', NULL, NULL, 'New Delhi', '07', 'B2B', 'INR', '30 Days', 'Paid', 30000.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00, 35400.00, 'New Report Change Request'),
(11, 'CSINV-00038', 'Tax Invoice', 1, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', '2026-09-25', '2026-10-24', NULL, NULL, 'New Delhi', '07', 'B2B', 'INR', '30 Days', 'Issued', 30000.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00, 0.00, 'Created from Proforma CSINV-00037'),
(12, 'CSINV-00039', 'Tax Invoice', 1, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', '2026-09-28', '2026-10-24', NULL, NULL, 'New Delhi', '07', 'B2B', 'INR', '30 Days', 'Paid', 30000.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00, 35400.00, 'Created from Proforma CSINV-00037'),
(13, 'CSINV-00040', 'Tax Invoice', 4, 'Eduvrse Pvt ltd', '06AAJCE9775G1Z5', '107, Vipul Trade Centre, Sohna - Gurgaon Rd, Sector 48, Gurugram, Haryana 122018', 'Haryana', '06', '122018', '2026-09-29', '2026-10-01', NULL, NULL, 'Haryana', '06', 'B2B', 'INR', '30 Days', 'Issued', 150000.00, 150000.00, 0.00, 0.00, 27000.00, 177000.00, 0.00, 'Education ERP implementation milestone'),
(15, 'CSINV-00042', 'Tax Invoice', 1, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', '2026-09-30', '2026-10-01', NULL, NULL, 'New Delhi', '07', 'B2B', 'INR', '30 Days', 'Issued', 48000.00, 48000.00, 4320.00, 4320.00, 0.00, 56640.00, 0.00, 'Scrap Management form & uploader customization'),
(20, 'CSINV-00047', 'Tax Invoice', 1, 'Taj computer Solutions Pvt Ltd', '07AAECT3412A1ZZ', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur,', 'New Delhi', '07', '110044', '2026-10-06', '2026-10-09', NULL, NULL, 'New Delhi', '07', 'B2B', 'INR', '30 Days', 'Issued', 359340.00, 359340.00, 32340.60, 32340.60, 0.00, 424021.20, 0.00, 'Dynamics 365 Team & Essential Annual Licenses');

-- 6. Invoice Items
CREATE TABLE finance_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES finance_invoices(id),
    description VARCHAR(255) NOT NULL,
    hsn_sac VARCHAR(20),
    unit VARCHAR(30) DEFAULT 'Service',
    quantity NUMERIC(12,3) DEFAULT 1.000,
    unit_price NUMERIC(14,2) DEFAULT 0.00,
    tax_percent NUMERIC(6,2) DEFAULT 18.00,
    taxable_value NUMERIC(14,2) DEFAULT 0.00,
    cgst_amount NUMERIC(14,2) DEFAULT 0.00,
    sgst_amount NUMERIC(14,2) DEFAULT 0.00,
    igst_amount NUMERIC(14,2) DEFAULT 0.00,
    line_total NUMERIC(14,2) DEFAULT 0.00
);

INSERT INTO finance_invoice_items (id, invoice_id, description, hsn_sac, unit, quantity, unit_price, tax_percent, taxable_value, cgst_amount, sgst_amount, igst_amount, line_total) VALUES
(7, 7, 'AMC TAJ-AMC-2026-27 · Renewal', '998313', 'Service', 1.000, 300000.00, 18.00, 300000.00, 27000.00, 27000.00, 0.00, 354000.00),
(9, 9, 'Consultancy', '998313', 'Service', 1.000, 250000.00, 18.00, 250000.00, 0.00, 0.00, 45000.00, 295000.00),
(10, 10, 'CHG-00001 · Reports', '998313', 'Service', 1.000, 30000.00, 18.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00),
(11, 11, 'CHG-00001 · Reports', '998313', 'Service', 1.000, 30000.00, 18.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00),
(12, 12, 'CHG-00001 · Reports', '998313', 'Service', 1.000, 30000.00, 18.00, 30000.00, 2700.00, 2700.00, 0.00, 35400.00),
(13, 13, 'Education ERP - School Admin Portal, Student Portal, Parent Portal & Mobile Application', '998313', 'Service', 1.000, 150000.00, 18.00, 150000.00, 0.00, 0.00, 27000.00, 177000.00),
(15, 15, 'Scrap Management form & uploader', '998313', 'Service', 1.000, 48000.00, 18.00, 48000.00, 4320.00, 4320.00, 0.00, 56640.00),
(28, 20, 'Dynamics 365 Business Central Team · Yearly', '997331', 'License', 5.000, 7980.00, 18.00, 39900.00, 3591.00, 3591.00, 0.00, 47082.00),
(29, 20, 'MS D365 Business Central Essential · Yearly', '997331', 'License', 4.000, 79860.00, 18.00, 319440.00, 28749.60, 28749.60, 0.00, 376939.20);

-- 7. Payments
CREATE TABLE finance_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES finance_invoices(id),
    payment_date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    payment_stage VARCHAR(30) DEFAULT 'Other',
    payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
    reference_no VARCHAR(100),
    notes VARCHAR(255)
);

INSERT INTO finance_payments (id, invoice_id, payment_date, amount, payment_stage, payment_mode, reference_no, notes) VALUES
(1, 7, '2026-09-08', 347000.00, 'Other', 'Bank Transfer', 'UTR-BOB-99824', 'Part Payment for AMC Invoice CSINV-00035'),
(2, 7, '2026-09-15', 7000.00, 'Balance', 'Bank Transfer', 'UTR-BOB-99890', 'Balance Payment for AMC Invoice CSINV-00035'),
(3, 12, '2026-09-29', 35400.00, 'Other', 'Bank Transfer', 'NEFT-TAJ-7712', 'Full payment for CR Invoice CSINV-00039'),
(4, 10, '2026-09-29', 35400.00, 'Other', 'Bank Transfer', 'NEFT-TAJ-7713', 'Full payment for Proforma CSINV-00037'),
(5, 9, '2026-09-29', 135000.00, 'Other', 'Bank Transfer', 'RTGS-IGPL-5541', 'Advance payment for Consultancy CSINV-00036');

-- 8. Purchase Orders
CREATE TABLE finance_purchase_orders (
    id SERIAL PRIMARY KEY,
    po_no VARCHAR(40) NOT NULL UNIQUE,
    po_date DATE NOT NULL,
    expected_date DATE,
    supplier_customer_id INT REFERENCES customers(id),
    supplier_name VARCHAR(190) NOT NULL,
    supplier_gstin VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'INR',
    payment_terms VARCHAR(100) DEFAULT '30 Days',
    status VARCHAR(30) DEFAULT 'Draft',
    subtotal NUMERIC(14,2) DEFAULT 0.00,
    taxable_amount NUMERIC(14,2) DEFAULT 0.00,
    igst_amount NUMERIC(14,2) DEFAULT 0.00,
    grand_total NUMERIC(14,2) DEFAULT 0.00
);

INSERT INTO finance_purchase_orders (id, po_no, po_date, expected_date, supplier_customer_id, supplier_name, supplier_gstin, currency, payment_terms, status, subtotal, taxable_amount, igst_amount, grand_total) VALUES
(1, 'PO-00001', '2026-10-05', '2026-10-06', 2, 'incite Gravity Pvt Ltd', '06AAHCI1841H1ZQ', 'INR', '30 Days', 'Approved', 4080.00, 4080.00, 734.40, 4814.40);

-- 9. Sales Orders
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(40) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    customer_id INT REFERENCES customers(id),
    customer_name VARCHAR(190) NOT NULL,
    place_of_supply VARCHAR(120),
    currency VARCHAR(10) DEFAULT 'INR',
    payment_terms VARCHAR(120) DEFAULT '30 Days',
    status VARCHAR(30) DEFAULT 'Draft',
    subtotal NUMERIC(15,2) DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) DEFAULT 0.00
);

INSERT INTO sales_orders (id, order_no, order_date, customer_id, customer_name, place_of_supply, currency, payment_terms, status, subtotal, taxable_amount, igst_amount, grand_total) VALUES
(1, 'SO/2026-27/00001', '2026-10-05', 5, 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD', 'Punjab (03)', 'INR', '30 Days', 'Draft', 1500150.00, 1500150.00, 270027.00, 1770177.00);

-- 10. Opportunities
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    opportunity_no VARCHAR(32) NOT NULL UNIQUE,
    customer_id INT REFERENCES customers(id),
    title VARCHAR(190) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'In Progress',
    probability INT DEFAULT 25,
    estimated_deal_value NUMERIC(15,2) DEFAULT 0.00,
    expected_close_date DATE
);

INSERT INTO opportunities (id, opportunity_no, customer_id, title, stage, status, probability, estimated_deal_value, expected_close_date) VALUES
(1, 'OPP-2026-00641', 3, 'Build Storys Pvt Ltd - AI Application & CRM', 'Won', 'Won', 100, 1800000.00, '2027-01-27'),
(2, 'OPP-2026-00643', 5, 'DHIMAN IRON AND STEEL - D365 Implementation', 'Won', 'Won', 100, 1650000.00, '2027-02-15'),
(3, 'OPP-2026-00640', 4, 'Eduvrse Pvt ltd - Education ERP', 'Won', 'Won', 100, 1200000.00, '2027-01-29'),
(4, 'OPP-2026-00644', 6, 'SS Steel Industry - Enterprise ERP', 'Negotiation', 'In Progress', 80, 1500000.00, '2027-03-15'),
(5, 'OPP-2026-00642', 1, 'Taj Computers - ERP Enhancement & AMC', 'Qualification', 'In Progress', 70, 1700000.00, '2027-03-30');

-- 11. Opportunity Payment Milestones
CREATE TABLE opportunity_payment_milestones (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    schedule_type VARCHAR(30) DEFAULT 'Implementation',
    milestone_name VARCHAR(50) NOT NULL,
    sequence_no INT NOT NULL,
    percentage NUMERIC(6,2) DEFAULT 0.00,
    milestone_amount NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Planned'
);

INSERT INTO opportunity_payment_milestones (id, customer_id, schedule_type, milestone_name, sequence_no, percentage, milestone_amount, status) VALUES
(1, 4, 'License', 'Advance', 1, 100.00, 0.00, 'Paid'),
(2, 4, 'Implementation', 'Advance', 1, 12.50, 150000.00, 'Planned'),
(3, 4, 'Implementation', 'FRD', 2, 20.00, 240000.00, 'Planned'),
(4, 4, 'Implementation', 'Development', 3, 37.50, 450000.00, 'Planned'),
(5, 4, 'Implementation', 'UAT', 4, 20.00, 240000.00, 'Planned'),
(6, 4, 'Implementation', 'Go-live', 5, 10.00, 120000.00, 'Planned');

-- 12. Activities
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    type VARCHAR(30) DEFAULT 'Task',
    subject VARCHAR(190) NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'Scheduled',
    priority VARCHAR(20) DEFAULT 'Medium'
);

INSERT INTO activities (id, customer_id, type, subject, description, due_at, status, priority) VALUES
(1, NULL, 'Meeting', 'Meeting for Digitalization', 'Meeting With yuvraj Jain (Ratan Textiles)', '2026-09-15 11:00:00+00', 'Scheduled', 'Medium'),
(2, NULL, 'Meeting', 'Solution Consultation', 'Discussion with INTERARCH BUILDING PRODUCTS', '2026-09-11 11:30:00+00', 'Completed', 'Medium'),
(3, 6, 'Follow-up', 'Commercial Negotiation Follow-up', 'Follow up for next stage with Ankur Goyal', '2026-09-30 10:47:00+00', 'Scheduled', 'High');
"""

with open('postgres_dump.sql', 'w') as f:
    f.write(sql_content)

print("postgres_dump.sql created successfully!")
