#!/usr/bin/env python3
"""Generate schema.sql for the Enact360 CRM relational store.

The schema is declared once here and emitted as idempotent DDL. Money/rate
columns are NUMERIC(18,4); ids are TEXT because the application uses string
ids ("lead-1", "usr-1", ...); child tables cascade from their parent.
"""

T = "TEXT"
M = "NUMERIC(18,4)"
I = "INTEGER"
B = "BOOLEAN"
TS = "TIMESTAMPTZ"
D = "DATE"
J = "JSONB"

# (table, pk_columns, [(col, type, extra)], [indexes], comment)
TABLES = []


def table(name, pk, cols, indexes=(), comment=""):
    TABLES.append((name, pk, cols, list(indexes), comment))


# --------------------------------------------------------------------------
# 0. Meta / singletons
# --------------------------------------------------------------------------
table("schema_migrations", ["version"], [
    ("version", T, "NOT NULL"),
    ("applied_at", TS, "NOT NULL DEFAULT NOW()"),
    ("description", T, ""),
], comment="Applied migration versions.")

table("app_settings", ["key"], [
    ("key", T, "NOT NULL"),
    ("value", J, ""),
    ("updated_at", TS, "NOT NULL DEFAULT NOW()"),
], comment="Singleton/global scalars (state_initialized, updated_at, payroll org masters, ...).")

table("document_counters", ["counter_key"], [
    ("counter_key", T, "NOT NULL"),
    ("value", "BIGINT", "NOT NULL DEFAULT 0"),
], comment="Running document-number counters (leads, invoices:Tax, ...).")

# --------------------------------------------------------------------------
# 1. Organisation / configuration singletons
# --------------------------------------------------------------------------
table("company_profile", ["source"], [
    ("source", T, "NOT NULL"),
    ("legacy_id", I, ""),
    ("name", T, ""), ("legal_name", T, ""), ("gstin", T, ""), ("pan", T, ""), ("cin", T, ""),
    ("state", T, ""), ("state_code", T, ""), ("city", T, ""), ("pincode", T, ""), ("address", T, ""),
    ("email", T, ""), ("phone", T, ""), ("website", T, ""), ("logo_url", T, ""),
    ("bank_name", T, ""), ("account_number", T, ""), ("ifsc_code", T, ""), ("branch", T, ""),
    ("bank_details", J, ""), ("bank_accounts", J, ""),
    ("ui_font_size", T, ""), ("ui_theme", T, ""),
    ("updated_at", TS, ""),
], comment="Company/supplier profile (single row).")

table("outlook_app_config", ["id"], [
    ("id", I, "NOT NULL"),
    ("client_id", T, ""), ("display_name", T, ""), ("object_id", T, ""), ("tenant_id", T, ""),
    ("redirect_uris", T, ""), ("managed_application", T, ""), ("smtp_host", T, ""),
    ("smtp_port", I, ""), ("supported_account_types", T, ""), ("state", T, ""),
    ("updated_at", TS, ""),
], comment="Outlook app registration config (single row).")

table("outlook_email_config", ["id"], [
    ("id", I, "NOT NULL"),
    ("enabled", B, ""), ("outlook_email", T, ""), ("cc_emails", T, ""), ("sender_display_name", T, ""),
    ("server_type", T, ""), ("smtp_host", T, ""), ("smtp_port", I, ""), ("use_start_tls", B, ""),
    ("app_display_name", T, ""), ("client_id", T, ""), ("object_id", T, ""), ("tenant_id", T, ""),
    ("supported_account_types", T, ""), ("redirect_uri_config", T, ""), ("managed_application", T, ""),
    ("app_state", T, ""),
    ("notify_on_lead", B, ""), ("notify_on_opportunity", B, ""), ("notify_on_order", B, ""),
    ("notify_on_invoice", B, ""), ("notify_on_payment", B, ""), ("notify_on_milestone", B, ""),
    ("notify_on_support", B, ""), ("notify_on_activity", B, ""), ("notify_on_user", B, ""),
    ("auto_include_assigned_owner", B, ""),
    ("updated_at", TS, ""),
], comment="Email-notification config (single row).")

# --------------------------------------------------------------------------
# 2. Users & permissions
# --------------------------------------------------------------------------
table("users", ["id"], [
    ("id", T, "NOT NULL"),
    ("name", T, ""), ("username", T, ""), ("email", T, ""),
    ("password_hash", T, ""),
    ("must_change_password", B, ""), ("must_change_password_on_first_login", B, ""),
    ("access_scope", T, ""), ("access_type", T, ""), ("emp_code", T, ""),
    ("phone", T, ""), ("designation", T, ""), ("role", T, ""), ("department", T, ""),
    ("status", T, ""), ("avatar", T, ""), ("last_login_at", TS, ""), ("location", T, ""),
    ("reporting_manager", T, ""), ("assigned_territory", T, ""), ("monthly_sales_target", M, ""),
    ("custom_permissions", J, ""),
    ("date_of_birth", D, ""), ("gender", T, ""), ("blood_group", T, ""), ("marital_status", T, ""),
    ("alternate_phone", T, ""), ("personal_email", T, ""), ("current_address", T, ""),
    ("permanent_address", T, ""), ("city", T, ""), ("state", T, ""), ("pin_code", T, ""),
    ("bank_name", T, ""), ("bank_account_no", T, ""), ("ifsc_code", T, ""), ("pan_number", T, ""),
    ("uan_number", T, ""), ("pf_account_no", T, ""), ("tax_regime", T, ""),
    ("emergency_contact_name", T, ""), ("emergency_contact_phone", T, ""), ("emergency_contact_relation", T, ""),
    ("highest_qualification", T, ""), ("institute", T, ""), ("passing_year", T, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["users_email_idx ON users (lower(email))", "users_username_idx ON users (lower(username))"],
   "Application users / employees.")

table("user_documents", ["id"], [
    ("id", T, "NOT NULL"),
    ("user_id", T, "NOT NULL"),
    ("name", T, ""), ("type", T, ""), ("document_number", T, ""), ("uploaded_at", TS, ""), ("sort_order", I, ""),
], ["user_documents_user_idx ON user_documents (user_id)"], "Documents attached to a user.")

table("role_permissions", ["role", "module"], [
    ("role", T, "NOT NULL"),
    ("module", T, "NOT NULL"),
    ("can_view", B, "NOT NULL DEFAULT FALSE"),
    ("can_create", B, "NOT NULL DEFAULT FALSE"),
    ("can_edit", B, "NOT NULL DEFAULT FALSE"),
    ("can_delete", B, "NOT NULL DEFAULT FALSE"),
], comment="CRM role x module permission matrix.")

table("payroll_role_permissions", ["role", "module"], [
    ("role", T, "NOT NULL"),
    ("module", T, "NOT NULL"),
    ("can_view", B, "NOT NULL DEFAULT FALSE"),
    ("can_create", B, "NOT NULL DEFAULT FALSE"),
    ("can_edit", B, "NOT NULL DEFAULT FALSE"),
    ("can_approve", B, "NOT NULL DEFAULT FALSE"),
], comment="Payroll role x module permission matrix.")

# --------------------------------------------------------------------------
# 3. Masters
# --------------------------------------------------------------------------
table("states", ["id"], [
    ("id", T, "NOT NULL"),
    ("state_name", T, ""), ("state_code", T, ""), ("country", T, ""), ("zone", T, ""),
    ("is_active", B, ""),
], comment="State master.")

table("tax_rates", ["id"], [
    ("id", T, "NOT NULL"),
    ("name", T, ""), ("code", T, ""), ("gst_rate", M, ""), ("cgst_rate", M, ""), ("sgst_rate", M, ""),
    ("igst_rate", M, ""), ("default_hsn_sac", T, ""), ("applicable_to", T, ""),
    ("description", T, ""), ("is_active", B, ""),
], comment="GST / tax-rate master.")

table("payment_terms", ["id"], [
    ("id", T, "NOT NULL"),
    ("name", T, ""), ("code", T, ""), ("credit_days", I, ""), ("description", T, ""),
    ("default_milestones", T, ""), ("is_active", B, ""),
], comment="Payment-terms master.")

table("products", ["id"], [
    ("id", T, "NOT NULL"),
    ("code", T, ""), ("name", T, ""), ("type", T, ""), ("category", T, ""), ("subcategory", T, ""),
    ("description", T, ""), ("uom", T, ""), ("hsn_sac", T, ""), ("gst_rate", M, ""),
    ("cost_price", M, ""), ("selling_price", M, ""), ("discount_default", M, ""),
    ("is_active", B, ""), ("image", T, ""),
], ["products_code_idx ON products (code)"], "Product / service master.")

table("license_types", ["id"], [
    ("id", T, "NOT NULL"),
    ("code", T, ""), ("name", T, ""), ("description", T, ""), ("hsn_sac", T, ""),
    ("monthly_cost", M, ""), ("yearly_cost", M, ""), ("status", T, ""),
], comment="License-type master.")

# --------------------------------------------------------------------------
# 4. Leads
# --------------------------------------------------------------------------
table("leads", ["id"], [
    ("id", T, "NOT NULL"),
    ("lead_number", T, ""), ("lead_date", D, ""),
    ("company_name", T, ""), ("contact_person", T, ""), ("designation", T, ""),
    ("mobile", T, ""), ("email", T, ""), ("website", T, ""),
    ("address", T, ""), ("country", T, ""), ("state", T, ""), ("state_code", T, ""),
    ("city", T, ""), ("pincode", T, ""),
    ("lead_source", T, ""), ("lead_type", T, ""), ("industry", T, ""), ("requirement", T, ""),
    ("primary_product_id", T, ""), ("product_interest_ids", J, ""),
    ("estimated_value", M, ""), ("budget", M, ""),
    ("expected_closing_date", D, ""), ("expected_go_live", D, ""),
    ("rating", T, ""), ("score", M, ""),
    ("create_primary_contact", B, ""), ("contact_first_name", T, ""), ("contact_last_name", T, ""),
    ("contact_department", T, ""), ("contact_mobile", T, ""), ("contact_linkedin", T, ""),
    ("next_activity", T, ""),
    ("lead_owner_id", T, ""), ("lead_owner_name", T, ""),
    ("priority", T, ""), ("status", T, ""), ("lost_reason", T, ""), ("remarks", T, ""),
    ("is_converted", B, ""), ("converted_customer_id", T, ""), ("converted_opportunity_id", T, ""),
    ("converted_opportunity_number", T, ""), ("converted_sales_order_id", T, ""), ("converted_at", TS, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["leads_owner_idx ON leads (lead_owner_id)", "leads_status_idx ON leads (status)",
    "leads_number_idx ON leads (lead_number)"], "Leads.")

table("lead_timeline_events", ["id"], [
    ("id", T, "NOT NULL"),
    ("lead_id", T, "NOT NULL"),
    ("type", T, ""), ("title", T, ""), ("status", T, ""), ("detail", T, ""),
    ("date", TS, ""), ("follow_up_at", TS, ""), ("user_name", T, ""),
    ("sort_order", I, ""),
], ["lead_timeline_events_lead_idx ON lead_timeline_events (lead_id)"], "Lead timeline events.")

table("lead_linked_contacts", ["id"], [
    ("id", T, "NOT NULL"),
    ("lead_id", T, "NOT NULL"),
    ("first_name", T, ""), ("last_name", T, ""), ("title", T, ""), ("department", T, ""),
    ("email", T, ""), ("phone", T, ""), ("mobile", T, ""), ("linkedin", T, ""),
    ("source", T, ""), ("mailing_address", T, ""), ("created_at", TS, ""), ("sort_order", I, ""),
], ["lead_linked_contacts_lead_idx ON lead_linked_contacts (lead_id)"], "Contacts linked to a lead.")

# --------------------------------------------------------------------------
# 5. Opportunities
# --------------------------------------------------------------------------
table("opportunities", ["id"], [
    ("id", T, "NOT NULL"),
    ("opportunity_number", T, ""), ("opportunity_name", T, ""),
    ("lead_id", T, ""), ("lead_number", T, ""),
    ("customer_id", T, ""), ("customer_name", T, ""),
    ("contact_person", T, ""), ("contact_mobile", T, ""), ("contact_email", T, ""),
    ("state", T, ""), ("state_code", T, ""),
    ("sales_owner_id", T, ""), ("sales_owner_name", T, ""),
    ("expected_closing_date", D, ""), ("estimated_deal_value", M, ""), ("probability", M, ""),
    ("stage", T, ""), ("status", T, ""),
    ("next_follow_up", TS, ""), ("last_activity", TS, ""),
    ("product_interest_ids", J, ""),
    ("is_converted_to_order", B, ""), ("converted_sales_order_id", T, ""), ("converted_sales_order_number", T, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["opportunities_customer_idx ON opportunities (customer_id)",
    "opportunities_stage_idx ON opportunities (stage)"], "Opportunities.")

table("opportunity_remarks", ["id"], [
    ("id", T, "NOT NULL"),
    ("opportunity_id", T, "NOT NULL"),
    ("remark", T, ""), ("user_id", T, ""), ("user_name", T, ""),
    ("date", D, ""), ("time", T, ""), ("sort_order", I, ""),
], ["opportunity_remarks_opp_idx ON opportunity_remarks (opportunity_id)"], "Opportunity remarks.")

table("opportunity_tasks", ["id"], [
    ("id", T, "NOT NULL"),
    ("opportunity_id", T, "NOT NULL"),
    ("title", T, ""), ("description", T, ""),
    ("assigned_to_id", T, ""), ("assigned_to_name", T, ""),
    ("due_date", D, ""), ("priority", T, ""), ("status", T, ""),
    ("reminder", T, ""), ("completion_date", TS, ""), ("sort_order", I, ""),
], ["opportunity_tasks_opp_idx ON opportunity_tasks (opportunity_id)"], "Opportunity tasks.")

table("opportunity_attachments", ["id"], [
    ("id", T, "NOT NULL"),
    ("opportunity_id", T, "NOT NULL"),
    ("file_name", T, ""), ("file_size", M, ""), ("uploaded_by", T, ""), ("uploaded_at", TS, ""),
    ("sort_order", I, ""),
], ["opportunity_attachments_opp_idx ON opportunity_attachments (opportunity_id)"], "Opportunity attachments.")

# --------------------------------------------------------------------------
# 6. Customers & contacts
# --------------------------------------------------------------------------
table("customers", ["id"], [
    ("id", T, "NOT NULL"),
    ("customer_code", T, ""), ("name", T, ""), ("customer_type", T, ""), ("customer_group", T, ""),
    ("gstin", T, ""), ("pan", T, ""), ("email", T, ""), ("phone", T, ""), ("website", T, ""),
    ("industry", T, ""), ("payment_terms_id", T, ""), ("payment_terms_name", T, ""),
    ("credit_limit", M, ""), ("currency", T, ""), ("status", T, ""),
    ("sales_owner_id", T, ""), ("sales_owner_name", T, ""),
    ("remarks", T, ""), ("solution", T, ""), ("project_phase", T, ""), ("gst_rule", T, ""),
    ("from_lead_id", T, ""), ("from_lead_number", T, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["customers_code_idx ON customers (customer_code)"], "Customers.")

table("customer_addresses", ["id"], [
    ("id", T, "NOT NULL"),
    ("customer_id", T, "NOT NULL"),
    ("type", T, ""), ("title", T, ""), ("address_line1", T, ""), ("address_line2", T, ""),
    ("city", T, ""), ("state", T, ""), ("state_code", T, ""), ("country", T, ""),
    ("pincode", T, ""), ("is_default", B, ""), ("sort_order", I, ""),
], ["customer_addresses_customer_idx ON customer_addresses (customer_id)"], "Customer addresses.")

table("customer_contacts", ["id"], [
    ("id", T, "NOT NULL"),
    ("customer_id", T, ""), ("customer_name", T, ""),
    ("name", T, ""), ("designation", T, ""), ("department", T, ""),
    ("mobile", T, ""), ("email", T, ""), ("alternate_phone", T, ""),
    ("is_primary", B, ""), ("is_decision_maker", B, ""), ("status", T, ""), ("notes", T, ""),
], ["customer_contacts_customer_idx ON customer_contacts (customer_id)"], "Customer contacts.")

# --------------------------------------------------------------------------
# 7. Sales orders
# --------------------------------------------------------------------------
table("sales_orders", ["id"], [
    ("id", T, "NOT NULL"),
    ("order_number", T, ""), ("order_date", D, ""), ("delivery_date", D, ""),
    ("customer_id", T, ""), ("customer_name", T, ""),
    ("contact_id", T, ""), ("contact_name", T, ""),
    ("lead_reference_id", T, ""), ("lead_reference_number", T, ""),
    ("opportunity_reference_id", T, ""), ("opportunity_reference_number", T, ""),
    ("salesperson_id", T, ""), ("salesperson_name", T, ""),
    ("payment_terms_id", T, ""), ("payment_terms_name", T, ""),
    ("currency", T, ""),
    ("billing_address", J, ""), ("shipping_address", J, ""),
    ("is_inter_state", B, ""), ("supplier_state_code", T, ""),
    ("subtotal", M, ""), ("total_discount", M, ""), ("total_taxable", M, ""),
    ("total_cgst", M, ""), ("total_sgst", M, ""), ("total_igst", M, ""), ("total_tax", M, ""),
    ("grand_total", M, ""),
    ("status", T, ""), ("payment_status", T, ""),
    ("invoiced_amount", M, ""), ("paid_amount", M, ""), ("remaining_balance", M, ""),
    ("approved_by_id", T, ""), ("approved_by_name", T, ""), ("approved_at", TS, ""),
    ("approval_remarks", T, ""), ("remarks", T, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["sales_orders_customer_idx ON sales_orders (customer_id)",
    "sales_orders_number_idx ON sales_orders (order_number)"], "Sales orders.")

table("sales_order_items", ["id"], [
    ("id", T, "NOT NULL"),
    ("sales_order_id", T, "NOT NULL"),
    ("product_id", T, ""), ("product_code", T, ""), ("product_name", T, ""), ("description", T, ""),
    ("uom", T, ""), ("hsn_sac", T, ""),
    ("quantity", M, ""), ("unit_rate", M, ""), ("discount_percent", M, ""), ("discount_amount", M, ""),
    ("taxable_amount", M, ""), ("gst_rate", M, ""),
    ("cgst_amount", M, ""), ("sgst_amount", M, ""), ("igst_amount", M, ""), ("total_tax", M, ""),
    ("line_total", M, ""), ("sort_order", I, ""),
], ["sales_order_items_order_idx ON sales_order_items (sales_order_id)"], "Sales-order line items.")

# --------------------------------------------------------------------------
# 8. Purchase orders
# --------------------------------------------------------------------------
table("purchase_orders", ["id"], [
    ("id", T, "NOT NULL"),
    ("po_number", T, ""), ("po_date", D, ""), ("expected_delivery_date", D, ""),
    ("vendor_id", T, ""), ("vendor_name", T, ""), ("vendor_code", T, ""),
    ("vendor_gstin", T, ""), ("vendor_pan", T, ""), ("vendor_address", T, ""),
    ("vendor_state", T, ""), ("vendor_state_code", T, ""), ("vendor_city", T, ""), ("vendor_pincode", T, ""),
    ("vendor_phone", T, ""), ("vendor_email", T, ""), ("contact_person", T, ""),
    ("is_same_as_customer", B, ""), ("linked_customer_id", T, ""), ("reference_quotation_no", T, ""),
    ("payment_terms", T, ""), ("place_of_supply", T, ""), ("place_of_supply_code", T, ""),
    ("shipping_address", T, ""),
    ("subtotal", M, ""), ("total_discount", M, ""), ("taxable_amount", M, ""),
    ("cgst_amount", M, ""), ("sgst_amount", M, ""), ("igst_amount", M, ""), ("total_tax", M, ""),
    ("grand_total", M, ""),
    ("status", T, ""), ("terms_and_conditions", T, ""), ("notes", T, ""),
    ("approved_by_id", T, ""), ("approved_by_name", T, ""), ("approved_at", TS, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["purchase_orders_number_idx ON purchase_orders (po_number)"], "Purchase orders.")

table("purchase_order_items", ["id"], [
    ("id", T, "NOT NULL"),
    ("purchase_order_id", T, "NOT NULL"),
    ("product_id", T, ""), ("product_code", T, ""), ("product_name", T, ""), ("description", T, ""),
    ("hsn_sac", T, ""), ("unit", T, ""),
    ("quantity", M, ""), ("unit_price", M, ""), ("discount_percent", M, ""), ("taxable_amount", M, ""),
    ("gst_rate", M, ""), ("cgst_amount", M, ""), ("sgst_amount", M, ""), ("igst_amount", M, ""),
    ("total_tax", M, ""), ("line_total", M, ""), ("sort_order", I, ""),
], ["purchase_order_items_po_idx ON purchase_order_items (purchase_order_id)"], "Purchase-order line items.")

# --------------------------------------------------------------------------
# 9. Milestones, invoices, payments, ledger
# --------------------------------------------------------------------------
table("payment_milestones", ["id"], [
    ("id", T, "NOT NULL"),
    ("sales_order_id", T, ""), ("sales_order_number", T, ""),
    ("customer_id", T, ""), ("customer_name", T, ""),
    ("milestone_code", T, ""), ("description", T, ""),
    ("percentage", M, ""), ("amount", M, ""), ("due_date", D, ""), ("status", T, ""),
    ("invoiced_amount", M, ""), ("paid_amount", M, ""), ("opening_paid_amount", M, ""),
    ("proforma_invoice_id", T, ""), ("proforma_invoice_number", T, ""),
    ("invoice_id", T, ""), ("invoice_number", T, ""),
    ("is_shared", B, ""), ("remarks", T, ""),
], ["payment_milestones_order_idx ON payment_milestones (sales_order_id)",
    "payment_milestones_customer_idx ON payment_milestones (customer_id)"], "Payment milestones.")

table("invoices", ["id"], [
    ("id", T, "NOT NULL"),
    ("invoice_number", T, ""), ("invoice_type", T, ""),
    ("invoice_date", D, ""), ("due_date", D, ""),
    ("customer_id", T, ""), ("customer_name", T, ""), ("customer_gstin", T, ""),
    ("billing_address", J, ""), ("shipping_address", J, ""),
    ("sales_order_id", T, ""), ("sales_order_number", T, ""),
    ("milestone_id", T, ""), ("milestone_code", T, ""),
    ("source_type", T, ""), ("billing_component", T, ""), ("supply_type", T, ""), ("reverse_charge", T, ""),
    ("amc_contract_id", T, ""), ("amc_contract_number", T, ""),
    ("change_request_id", T, ""), ("change_request_number", T, ""),
    ("ticket_id", T, ""), ("ticket_number", T, ""),
    ("service_period_start", D, ""), ("service_period_end", D, ""),
    ("proforma_invoice_id", T, ""), ("proforma_invoice_number", T, ""),
    ("converted_to_tax_invoice_id", T, ""), ("converted_to_tax_invoice_number", T, ""),
    ("payment_stage", T, ""), ("po_number", T, ""), ("po_date", D, ""),
    ("is_shared", B, ""), ("shared_at", TS, ""), ("shared_by", T, ""),
    ("cancellation_reason", T, ""), ("cancelled_at", TS, ""),
    ("is_inter_state", B, ""), ("payment_terms_name", T, ""),
    ("subtotal_taxable", M, ""), ("total_cgst", M, ""), ("total_sgst", M, ""), ("total_igst", M, ""),
    ("total_tax", M, ""), ("grand_total", M, ""), ("paid_amount", M, ""), ("opening_paid_amount", M, ""),
    ("balance_amount", M, ""),
    ("status", T, ""), ("notes", T, ""), ("bank_details", J, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["invoices_customer_idx ON invoices (customer_id)",
    "invoices_number_idx ON invoices (invoice_number)",
    "invoices_type_idx ON invoices (invoice_type)"], "Invoices (proforma & tax).")

table("invoice_items", ["id"], [
    ("id", T, "NOT NULL"),
    ("invoice_id", T, "NOT NULL"),
    ("product_id", T, ""), ("product_name", T, ""), ("description", T, ""),
    ("hsn_sac", T, ""), ("uom", T, ""),
    ("quantity", M, ""), ("unit_rate", M, ""), ("taxable_amount", M, ""), ("gst_rate", M, ""),
    ("cgst_amount", M, ""), ("sgst_amount", M, ""), ("igst_amount", M, ""), ("total_tax", M, ""),
    ("line_total", M, ""), ("sort_order", I, ""),
], ["invoice_items_invoice_idx ON invoice_items (invoice_id)"], "Invoice line items.")

table("payment_receipts", ["id"], [
    ("id", T, "NOT NULL"),
    ("receipt_number", T, ""), ("payment_date", D, ""),
    ("customer_id", T, ""), ("customer_name", T, ""),
    ("sales_order_id", T, ""), ("sales_order_number", T, ""),
    ("invoice_id", T, ""), ("invoice_number", T, ""),
    ("milestone_id", T, ""), ("milestone_code", T, ""), ("payment_stage", T, ""),
    ("amount", M, ""), ("tds_deducted", M, ""), ("net_received", M, ""), ("remaining_balance", M, ""),
    ("payment_mode", T, ""), ("bank_cash_account", T, ""), ("transaction_reference", T, ""),
    ("remarks", T, ""), ("recorded_by_id", T, ""), ("recorded_by_name", T, ""),
    ("created_at", TS, ""),
], ["payment_receipts_customer_idx ON payment_receipts (customer_id)",
    "payment_receipts_invoice_idx ON payment_receipts (invoice_id)"], "Payment receipts.")

table("customer_ledger_entries", ["id"], [
    ("id", T, "NOT NULL"),
    ("customer_id", T, ""), ("date", D, ""), ("type", T, ""), ("reference_number", T, ""),
    ("description", T, ""), ("debit", M, ""), ("credit", M, ""), ("running_balance", M, ""),
    ("invoice_id", T, ""), ("payment_id", T, ""),
], ["customer_ledger_customer_idx ON customer_ledger_entries (customer_id)"], "Customer receivables ledger.")

# --------------------------------------------------------------------------
# 10. Activities, notifications, audit
# --------------------------------------------------------------------------
table("activities", ["id"], [
    ("id", T, "NOT NULL"),
    ("activity_type", T, ""), ("subject", T, ""), ("date", D, ""), ("time", T, ""),
    ("assigned_user_id", T, ""), ("assigned_user_name", T, ""),
    ("priority", T, ""), ("status", T, ""), ("notes", T, ""),
    ("lead_id", T, ""), ("lead_number", T, ""),
    ("opportunity_id", T, ""), ("opportunity_number", T, ""),
    ("customer_id", T, ""), ("customer_name", T, ""),
    ("sales_order_id", T, ""), ("sales_order_number", T, ""),
    ("contact_person", T, ""), ("completion_date", TS, ""), ("completion_notes", T, ""),
    ("created_at", TS, ""),
], ["activities_assigned_idx ON activities (assigned_user_id)"], "Activities.")

table("notifications", ["id"], [
    ("id", T, "NOT NULL"),
    ("type", T, ""), ("title", T, ""), ("message", T, ""), ("timestamp", TS, ""),
    ("is_read", B, ""), ("link_type", T, ""), ("link_id", T, ""),
    ("email_status", T, ""), ("email_recipient", T, ""), ("email_sent_at", TS, ""),
], comment="In-app notifications.")

table("audit_logs", ["id"], [
    ("id", T, "NOT NULL"),
    ("entity_type", T, ""), ("entity_id", T, ""), ("entity_number", T, ""),
    ("action", T, ""), ("description", T, ""),
    ("field_name", T, ""), ("old_value", T, ""), ("new_value", T, ""),
    ("performed_by_id", T, ""), ("performed_by_name", T, ""), ("timestamp", TS, ""),
], ["audit_logs_entity_idx ON audit_logs (entity_type, entity_id)"], "Audit trail.")

# --------------------------------------------------------------------------
# 11. AMC & support
# --------------------------------------------------------------------------
table("amc_contracts", ["id"], [
    ("id", T, "NOT NULL"),
    ("contract_number", T, ""),
    ("customer_id", T, ""), ("customer_code", T, ""), ("customer_name", T, ""), ("customer_gstin", T, ""),
    ("solution", T, ""), ("project_phase", T, ""),
    ("contract_type", T, ""), ("billing_cycle", T, ""),
    ("start_date", D, ""), ("end_date", D, ""),
    ("included_hours", M, ""), ("consumed_hours", M, ""), ("opening_consumed_hours", M, ""),
    ("hourly_overage_rate", M, ""), ("annual_value", M, ""), ("gst_rate", M, ""), ("total_value", M, ""),
    ("sla_tier", T, ""), ("account_manager_id", T, ""), ("account_manager_name", T, ""),
    ("status", T, ""), ("linked_invoice_id", T, ""), ("linked_invoice_number", T, ""),
    ("notes", T, ""), ("created_at", TS, ""), ("updated_at", TS, ""),
], ["amc_contracts_customer_idx ON amc_contracts (customer_id)"], "AMC / support contracts.")

table("support_tickets", ["id"], [
    ("id", T, "NOT NULL"),
    ("ticket_number", T, ""), ("ticket_date", D, ""),
    ("customer_id", T, ""), ("customer_code", T, ""), ("customer_name", T, ""),
    ("contact_name", T, ""), ("contact_email", T, ""), ("contact_phone", T, ""),
    ("contract_id", T, ""), ("contract_number", T, ""),
    ("solution", T, ""), ("module_name", T, ""), ("category", T, ""), ("department", T, ""),
    ("subject", T, ""), ("description", T, ""), ("priority", T, ""), ("status", T, ""),
    ("assigned_to_id", T, ""), ("assigned_to_name", T, ""), ("sla_status", T, ""),
    ("response_due_at", TS, ""), ("resolution_due_at", TS, ""), ("hours_logged", M, ""),
    ("is_billable", B, ""), ("estimated_billing_amount", M, ""),
    ("change_request_id", T, ""), ("change_request_number", T, ""),
    ("linked_invoice_id", T, ""), ("linked_invoice_number", T, ""),
    ("portal_source", T, ""), ("resolution_summary", T, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["support_tickets_customer_idx ON support_tickets (customer_id)",
    "support_tickets_status_idx ON support_tickets (status)"], "Support tickets.")

table("support_ticket_comments", ["id"], [
    ("id", T, "NOT NULL"),
    ("ticket_id", T, "NOT NULL"),
    ("author_id", T, ""), ("author_name", T, ""), ("author_role", T, ""),
    ("message", T, ""), ("is_internal", B, ""), ("department", T, ""),
    ("attachment_name", T, ""), ("created_at", TS, ""), ("sort_order", I, ""),
], ["support_ticket_comments_ticket_idx ON support_ticket_comments (ticket_id)"], "Support-ticket comments.")

table("support_change_requests", ["id"], [
    ("id", T, "NOT NULL"),
    ("cr_number", T, ""),
    ("ticket_id", T, ""), ("ticket_number", T, ""),
    ("customer_id", T, ""), ("customer_code", T, ""), ("customer_name", T, ""), ("customer_gstin", T, ""),
    ("contract_id", T, ""), ("contract_number", T, ""),
    ("title", T, ""), ("module_name", T, ""), ("scope_description", T, ""),
    ("estimated_hours", M, ""), ("hourly_rate", M, ""), ("taxable_amount", M, ""),
    ("gst_rate", M, ""), ("cgst_amount", M, ""), ("sgst_amount", M, ""), ("igst_amount", M, ""),
    ("total_amount", M, ""), ("status", T, ""),
    ("proforma_invoice_id", T, ""), ("proforma_invoice_number", T, ""),
    ("tax_invoice_id", T, ""), ("tax_invoice_number", T, ""),
    ("approved_by_customer_at", D, ""), ("requested_by", T, ""), ("assigned_developer_name", T, ""),
    ("created_at", TS, ""), ("updated_at", TS, ""),
], ["support_change_requests_customer_idx ON support_change_requests (customer_id)"], "Support change requests.")


# --------------------------------------------------------------------------
# 12. Payroll & ESS
# --------------------------------------------------------------------------
table("payroll_policy", ["id"], [
    ("id", I, "NOT NULL"),
    ("policy_code", T, ""), ("policy_version", T, ""), ("policy_title", T, ""),
    ("pl_quota", M, ""), ("cl_quota", M, ""), ("sl_quota", M, ""), ("comp_off_quota", M, ""),
    ("monthly_leave_limit", M, ""),
    ("shift_start_time", T, ""), ("shift_end_time", T, ""), ("early_arrival_cutoff", T, ""),
    ("cap_early_arrival", B, ""), ("grace_end_time", T, ""), ("grace_period_mins", M, ""),
    ("monthly_grace_limit", M, ""), ("late_cycle_half_day_nth", M, ""), ("late_cycle_deduction_days", M, ""),
    ("midday_entry_start_time", T, ""), ("midday_entry_end_time", T, ""), ("midday_entry_deduction_days", M, ""),
    ("post_midday_absent_deduction_days", M, ""),
    ("early_exit_absent_before_time", T, ""), ("early_exit_half_day_end_time", T, ""),
    ("regular_exit_after_time", T, ""), ("daily_break_window", T, ""), ("max_break_duration_mins", M, ""),
    ("break_exceeded_deduction_days", M, ""),
    ("holiday_saturday_numbers", J, ""), ("sundays_off", B, ""),
    ("weekly_holiday_saturdays", T, ""), ("working_saturdays", T, ""),
    ("require_advance_leave_approval", B, ""), ("pay_disbursement_day", T, ""),
    ("default_basic_pct", M, ""), ("default_hra_pct", M, ""), ("default_special_pct", M, ""),
    ("default_sales_commission_pct", M, ""), ("default_pf_cap_basic", M, ""), ("default_prof_tax", M, ""),
    ("default_tds_pct", M, ""), ("last_published_month", T, ""),
    ("loan_shortfall_policy", T, ""), ("loan_max_deduction_pct_of_net", M, ""),
    ("loan_max_eligibility_multiple", M, ""), ("loan_default_interest_rate", M, ""),
    ("data", J, ""),
], comment="HR attendance / leave / payroll policy (single row).")

table("payroll_integration_config", ["id"], [
    ("id", I, "NOT NULL"),
    ("provider", T, ""), ("provider_label", T, ""), ("portal_url", T, ""), ("sso_enabled", B, ""),
    ("launch_mode", T, ""), ("operation_mode", T, ""),
    ("fetch_api_endpoint", T, ""), ("push_webhook_endpoint", T, ""), ("api_tenant_key", T, ""),
    ("sync_crm_incentives", B, ""), ("sync_reimbursements", B, ""),
    ("auto_push_attendance_and_leaves", B, ""), ("fetched_gross_salary_override", M, ""),
    ("last_synced_at", TS, ""), ("last_fetched_at", TS, ""), ("last_pushed_at", TS, ""),
    ("data", J, ""),
], comment="Payroll integration config (single row).")

table("payroll_org_masters", ["id"], [
    ("id", I, "NOT NULL"),
    ("data", J, ""),
], comment="Payroll org masters (single row, jsonb).")

table("payroll_masters", ["id"], [
    ("id", T, "NOT NULL"),
    ("user_id", T, ""), ("emp_code", T, ""), ("name", T, ""), ("email", T, ""),
    ("role", T, ""), ("department", T, ""), ("designation", T, ""), ("status", T, ""),
    ("data", J, ""),
], ["payroll_masters_user_idx ON payroll_masters (user_id)"],
   "Employee salary master (typed keys + full record in data).")

table("payroll_loans", ["id"], [
    ("id", T, "NOT NULL"),
    ("employee_id", T, ""), ("employee_name", T, ""), ("loan_type", T, ""),
    ("principal_amount", M, ""), ("status", T, ""),
    ("data", J, ""),
], ["payroll_loans_employee_idx ON payroll_loans (employee_id)"], "Employee loans.")

table("payroll_attendance", ["employee_id"], [
    ("employee_id", T, "NOT NULL"),
    ("date", D, ""), ("punched_in", B, ""), ("punch_in_time", T, ""), ("punch_out_time", T, ""),
    ("work_mode", T, ""), ("location_sharing_enabled", B, ""),
    ("data", J, ""),
], comment="Per-employee attendance state.")

table("payroll_leaves", ["id"], [
    ("id", T, "NOT NULL"),
    ("employee_id", T, ""), ("start_date", D, ""), ("end_date", D, ""),
    ("days", M, ""), ("status", T, ""), ("data", J, ""),
], ["payroll_leaves_employee_idx ON payroll_leaves (employee_id)"], "Leave requests.")

table("payroll_claims", ["id"], [
    ("id", T, "NOT NULL"),
    ("employee_id", T, ""), ("amount", M, ""), ("status", T, ""), ("data", J, ""),
], ["payroll_claims_employee_idx ON payroll_claims (employee_id)"], "Expense claims.")

table("payroll_statutory", ["employee_id"], [
    ("employee_id", T, "NOT NULL"),
    ("emp_code", T, ""), ("pan_number", T, ""), ("uan_number", T, ""), ("pf_account_no", T, ""),
    ("bank_name", T, ""), ("ifsc_code", T, ""), ("tax_regime", T, ""), ("data", J, ""),
], comment="Per-employee statutory details.")

# Envelope tables: typed primary key + full record as jsonb. These payroll
# sub-collections are large and still evolving; the app writes whole records.
for _name, _comment in [
    ("payroll_locations", "Payroll work locations."),
    ("payroll_regularization", "Attendance regularization requests."),
    ("payroll_shifts", "Shift definitions."),
    ("payroll_shift_assignments", "Shift assignments."),
    ("payroll_shift_swaps", "Shift swap requests."),
    ("payroll_help_desk", "HR help-desk tickets."),
    ("payroll_runs", "Payroll runs."),
    ("payroll_lifecycle", "Employee lifecycle events."),
    ("payroll_assets", "Assets."),
    ("payroll_asset_categories", "Asset categories."),
    ("payroll_asset_allocations", "Asset allocations."),
    ("payroll_job_openings", "Job openings."),
    ("payroll_candidates", "Candidates."),
    ("payroll_onboarding", "Onboarding plans."),
    ("payroll_performance", "Performance reviews."),
    ("payroll_training_programs", "Training programs."),
    ("payroll_training_nominations", "Training nominations."),
    ("payroll_user_permissions", "Per-user payroll permissions."),
    ("payroll_daily_attendance", "Daily attendance records."),
]:
    table(_name, ["id"], [
        ("id", T, "NOT NULL"),
        ("created_at", TS, ""), ("updated_at", TS, ""),
        ("data", J, ""),
    ], comment=_comment)


def emit():
    out = []
    out.append("-- Enact360 CRM - normalized PostgreSQL schema")
    out.append("-- Generated by gen_schema.py. Idempotent: safe to re-run.")
    out.append("")
    out.append("BEGIN;")
    out.append("")
    for name, pk, cols, indexes, comment in TABLES:
        if comment:
            out.append(f"-- {comment}")
        out.append(f"CREATE TABLE IF NOT EXISTS {name} (")
        lines = []
        for col, typ, extra in cols:
            lines.append(f"  {col} {typ}" + (f" {extra}" if extra else ""))
        lines.append(f"  PRIMARY KEY ({', '.join(pk)})")
        out.append(",\n".join(lines))
        out.append(");")
        for idx in indexes:
            idx_name = idx.split(" ")[0]
            rest = idx[len(idx_name) + 1:].strip()
            if rest.upper().startswith("ON "):
                rest = rest[3:].strip()
            out.append(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {rest};")
        out.append("")
    out.append("COMMIT;")
    out.append("")
    return "\n".join(out)


def emit_ts(sql: str) -> str:
    """Bundle the DDL as a TS string so the runtime never reads a file."""
    esc = sql.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    return (
        "// AUTO-GENERATED from schema.sql by gen_schema.py. Do not edit by hand.\n"
        "// Bundled so the runtime never needs to read a file from disk.\n"
        "export const SCHEMA_SQL = `" + esc + "`;\n"
    )


if __name__ == "__main__":
    import sys
    text = emit()
    with open(sys.argv[1] if len(sys.argv) > 1 else "schema.sql", "w") as fh:
        fh.write(text)
    with open("backend_schema.ts", "w") as fh:
        fh.write(emit_ts(text))
    print(f"wrote {len(TABLES)} tables -> schema.sql + backend_schema.ts")
