import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} catch {
  console.warn('DB not connected — mock active');
  pool = {
    query: async () => ({ rows: [{ cnt: '0' }] }),
    connect: async () => ({ query: async () => ({ rows: [{ cnt: '0' }] }), release: () => {} }),
    end: async () => {},
  };
}

async function seed() {
  console.log('Connecting to Render PostgreSQL...');
  const client = await pool.connect();
  try {
    console.log('Connected! Verifying / creating tables...');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(80) PRIMARY KEY,
        name VARCHAR(190) NOT NULL,
        username VARCHAR(100),
        email VARCHAR(190) NOT NULL UNIQUE,
        phone VARCHAR(50),
        role VARCHAR(60) NOT NULL DEFAULT 'Sales Executive',
        department VARCHAR(60) NOT NULL DEFAULT 'Sales',
        designation VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Active',
        avatar TEXT,
        location VARCHAR(100),
        last_login_at TIMESTAMPTZ,
        custom_permissions JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;
    `);

    // 2. Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(80) PRIMARY KEY,
        code VARCHAR(60) NOT NULL UNIQUE,
        name VARCHAR(190) NOT NULL,
        type VARCHAR(40) DEFAULT 'Product',
        category VARCHAR(100),
        description TEXT,
        uom VARCHAR(40) DEFAULT 'Each',
        hsn_sac VARCHAR(40),
        gst_rate NUMERIC(6,2) DEFAULT 18.00,
        cost_price NUMERIC(14,2) DEFAULT 0.00,
        selling_price NUMERIC(14,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(80) PRIMARY KEY,
        lead_number VARCHAR(60) NOT NULL UNIQUE,
        lead_date DATE,
        company_name VARCHAR(190) NOT NULL,
        contact_person VARCHAR(140) NOT NULL,
        designation VARCHAR(100),
        mobile VARCHAR(40) NOT NULL,
        email VARCHAR(190),
        website VARCHAR(190),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        state_code VARCHAR(10),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(20),
        lead_source VARCHAR(60) DEFAULT 'Website',
        lead_type VARCHAR(60) DEFAULT 'Inbound',
        industry VARCHAR(100),
        requirement TEXT,
        estimated_value NUMERIC(15,2) DEFAULT 0.00,
        budget NUMERIC(15,2) DEFAULT 0.00,
        expected_closing_date DATE,
        rating VARCHAR(30) DEFAULT 'Warm',
        score INT DEFAULT 50,
        priority VARCHAR(30) DEFAULT 'Medium',
        status VARCHAR(40) DEFAULT 'New',
        lead_owner_id VARCHAR(80),
        lead_owner_name VARCHAR(140),
        is_converted BOOLEAN DEFAULT FALSE,
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(80) PRIMARY KEY,
        action VARCHAR(80) NOT NULL,
        entity_type VARCHAR(80) NOT NULL,
        entity_id VARCHAR(80),
        details TEXT,
        user_name VARCHAR(140),
        user_id VARCHAR(80),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if users exist
    const { rows: userRows } = await client.query('SELECT COUNT(*) as cnt FROM users');
    if (parseInt(userRows[0].cnt, 10) === 0) {
      console.log('Seeding initial users...');
      const initialUsers = [
        ['usr-1', 'Shalv Sharma', 'shalv', 'shalv.sharma@coreenact.com', '9810998290', 'Super Admin', 'Executive', 'Managing Director & Founder', 'Active', 'New Delhi'],
        ['usr-2', 'Priya Nair', 'priya', 'priya.nair@coreenact.com', '9810998291', 'Sales Manager', 'Sales', 'Senior Sales Director', 'Active', 'Bengaluru'],
        ['usr-3', 'Rahul Verma', 'rahul', 'rahul.verma@coreenact.com', '9810998292', 'Sales Executive', 'Sales', 'Enterprise Account Executive', 'Active', 'Mumbai'],
        ['usr-4', 'Sneha Kulkarni', 'sneha', 'sneha.k@coreenact.com', '9810998293', 'Finance Manager', 'Finance', 'Head of Billing & Receivables', 'Active', 'Bengaluru'],
        ['usr-5', 'Amit Patel', 'amit', 'amit.patel@coreenact.com', '9810998294', 'Finance Executive', 'Finance', 'Accounts & GST Officer', 'Active', 'Ahmedabad'],
        ['usr-6', 'Neha Gupta', 'neha', 'neha.gupta@coreenact.com', '9810998295', 'Management/Viewer', 'Executive', 'VP of Strategy (Read-Only)', 'Active', 'New Delhi'],
        ['usr-7', 'Vikram Malhotra', 'vikram', 'vikram.m@coreenact.com', '9810998296', 'Administrator', 'Operations', 'Operations Director', 'Active', 'Pune']
      ];

      for (const u of initialUsers) {
        await client.query(
          `INSERT INTO users (id, name, username, email, phone, role, department, designation, status, location)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          u
        );
      }
      console.log('Users seeded successfully!');
    }

    // Check if products exist
    const { rows: prodRows } = await client.query('SELECT COUNT(*) as cnt FROM products');
    if (parseInt(prodRows[0].cnt, 10) === 0) {
      console.log('Seeding initial products...');
      const initialProducts = [
        ['prod-1', 'D365-BC-ESS', 'MS D365 Business Central Essential', 'Service', 'Microsoft D365 ERP', 'Annual Essential Cloud subscription per user', 'License', '997331', 18, 6655, 79860],
        ['prod-2', 'D365-BC-DEV', 'MS D365 Business Central Device', 'Service', 'Microsoft D365 ERP', 'Shared operational device license', 'License', '997331', 18, 3780, 45360],
        ['prod-3', 'D365-BC-TEAM', 'MS D365 Business Central Team Member', 'Service', 'Microsoft D365 ERP', 'Read-only and light update team member license', 'License', '997331', 18, 665, 7980],
        ['prod-4', 'M365-BASIC', 'Microsoft 365 Business Basic', 'Subscription', 'Productivity Suite', 'M365 Cloud productivity suite with Exchange & Teams', 'License', '997331', 18, 170, 2040],
        ['prod-5', 'SRV-ERP-IMP', 'Enterprise ERP Implementation Service', 'Service', 'Professional Consulting', 'End-to-end ERP implementation, FRD, configuration and testing', 'Mandays', '998313', 18, 1200000, 1500000],
        ['prod-6', 'SRV-CUSTOM-DEV', 'Custom Module & Report Engineering', 'Service', 'Custom Development', 'Custom feature and API integration engineering', 'Hours', '998313', 18, 2500, 3500],
        ['prod-7', 'AMC-ANNUAL', 'Annual Maintenance & Support Contract (AMC)', 'Service', 'Support & Maintenance', 'Comprehensive 24/7 technical and functional SLA maintenance', 'Year', '998313', 18, 250000, 300000]
      ];

      for (const p of initialProducts) {
        await client.query(
          `INSERT INTO products (id, code, name, type, category, description, uom, hsn_sac, gst_rate, cost_price, selling_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          p
        );
      }
      console.log('Products seeded successfully!');
    }

    // Check if leads exist
    const { rows: leadRows } = await client.query('SELECT COUNT(*) as cnt FROM leads');
    if (parseInt(leadRows[0].cnt, 10) === 0) {
      console.log('Seeding initial leads...');
      const initialLeads = [
        ['lead-1', 'LEAD-2026-00001', '2026-09-01', 'Taj computer Solutions Pvt Ltd', 'Sawan Pathak', 'Finance Manager', '+91 72909 96601', 'sawankumar@tajcomputersolutions.com', 'https://tajcomputersolutions.com', 'B-2/28 , Mohan Cooperative Industrial Area, Badarpur', 'New Delhi', 'Delhi', '07', 'India', '110044', 'Referral', 'Existing Account', 'Trading', 'Annual AMC Renewal and D365 Team licenses', 1700000, 1800000, '2027-03-30', 'Hot', 92, 'Urgent', 'Won', 'usr-2', 'Priya Nair', true],
        ['lead-2', 'LEAD-2026-00002', '2026-09-05', 'incite Gravity Pvt Ltd', 'Srikant Jena', 'Director', '8290090611', 'srikant@incitegravity.com', 'https://incitegravity.com', 'EROS CORPORATE PARK, 1023-1024, Sec-2, IMT, Manesar', 'Gurugram', 'Haryana', '06', 'India', '122052', 'LinkedIn', 'Inbound', 'IT', 'Email migration, D365 setup and integration', 295000, 300000, '2026-12-15', 'Warm', 85, 'High', 'Won', 'usr-3', 'Rahul Verma', true],
        ['lead-3', 'LEAD-2026-00003', '2026-09-12', 'Build Storys Pvt Ltd', 'Shruthi', 'Founder', '97403 82382', 'shruthi@buildstorys.com', 'https://buildstorys.com', 'Building No.2122/5, Sahakarnagar', 'Bengaluru', 'Karnataka', '29', 'India', '560092', 'Website', 'Inbound', 'Real Estate', 'AI Based CRM & HRMS automation architecture', 1800000, 2000000, '2027-01-27', 'Hot', 95, 'Urgent', 'Won', 'usr-2', 'Priya Nair', true],
        ['lead-4', 'LEAD-2026-00004', '2026-09-18', 'Eduvrse Pvt ltd', 'Eshant Sharma', 'Director', '9999100186', 'eshant.sharma@eduvrse.com', '', '107, Vipul Trade Centre, Sohna Rd, Sector 48', 'Gurugram', 'Haryana', '06', 'India', '122018', 'Expo/Event', 'Inbound', 'Education', 'Comprehensive Education ERP & School Management', 1200000, 1200000, '2027-01-29', 'Warm', 88, 'High', 'Won', 'usr-3', 'Rahul Verma', true],
        ['lead-5', 'LEAD-2026-00005', '2026-09-22', 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD', 'Jiten', 'Director', '9878681000', 'jitengoyal@rrgg.in', 'https://www.rrgg.in', 'G.T.Road, Khanna Side, Mandi Gobindgarh', 'Mandi Gobindgarh', 'Punjab', '03', 'India', '141401', 'Partner', 'Outbound', 'Manufacturing', 'Complete steel inventory and plant automation with MS D365', 1650000, 1700000, '2027-02-15', 'Hot', 90, 'High', 'Won', 'usr-2', 'Priya Nair', true],
        ['lead-6', 'LEAD-2026-00006', '2026-09-28', 'SS Steel Industry', 'Ankur Goyal', 'Director', '98147 55580', 'info@sssteelindustry.com', '', 'Industrial Area', 'Mandi Gobindgarh', 'Punjab', '03', 'India', '141401', 'Cold Call', 'Outbound', 'Manufacturing', 'Supply chain & ERP quotation evaluation', 1500000, 1500000, '2027-03-15', 'Warm', 75, 'Medium', 'Negotiation', 'usr-3', 'Rahul Verma', false],
        ['lead-7', 'LEAD-2026-00007', '2026-10-02', 'Ratan Textiles Pvt Ltd', 'Yuvraj Jain', 'VP Operations', '9829012345', 'yuvraj@ratantextiles.com', 'https://ratantextiles.com', 'F-145, Malviya Industrial Area', 'Jaipur', 'Rajasthan', '08', 'India', '302017', 'Website', 'Inbound', 'Textile / Export', 'Textile export invoicing, SAC coding & ERP evaluation', 850000, 900000, '2027-04-15', 'Warm', 65, 'Medium', 'Qualified', 'usr-2', 'Priya Nair', false]
      ];

      for (const l of initialLeads) {
        await client.query(
          `INSERT INTO leads (id, lead_number, lead_date, company_name, contact_person, designation, mobile, email, website, address, city, state, state_code, country, pincode, lead_source, lead_type, industry, requirement, estimated_value, budget, expected_closing_date, rating, score, priority, status, lead_owner_id, lead_owner_name, is_converted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
           ON CONFLICT (id) DO NOTHING`,
          l
        );
      }
      console.log('Leads seeded successfully!');
    }

    console.log('Database verification and seed completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
