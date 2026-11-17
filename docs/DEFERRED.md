# Deferred items (left out on purpose, to build later)

Things the designs show, or the plan calls for, that are **not built yet** and why. Nothing here is forgotten:
each has a visible reminder in the product (a "Not connected yet" card, a "Soon" item) or a
`DEFERRED(Dxx)` comment in the code. Search for `DEFERRED(` to find them. When one is built, delete its row
and its reminder.

| ID | What | Where it shows | Waiting for | Planned |
|----|------|----------------|-------------|---------|
| D01 | Scan activity chart (scans per day, authentic share) | Manufacturer Overview | Verification events reaching the manufacturer (consumer and retailer scans stored per batch) | Phase 1, Week 8-9 |
| D02 | Top scan locations | Manufacturer Overview | Scan location capture and the fraud intelligence engine | Phase 1, Week 11 |
| D03 | "Suspected counterfeit scans" count and review link | Manufacturer Overview, Needs attention | Fraud rules, alerts and cases | Phase 1, Week 11 |
| D04 | Plan and usage: plan name, monthly code allowance, batch declaration limit, usage bar | Sidebar plan card, Overview "Codes generated this month" | Plans and billing; payment gateway not chosen yet | Phase 1, Week 10 |
| D05 | Seat limit on the team ("7 of 10 seats") | Team Management | Plans and billing (D04) | With D04 |
| D06 | Invitations sent by e-mail automatically | Team Management, Invite member | A custom e-mail service (SMTP); for now the administrator copies the link | When SMTP is set up |
| D07 | Audit Logs screen (filter, export) | Sidebar "Soon" | Built on `manufacturer_activity`, which already records events | Phase 1 |
| D08 | Settings (company, security) and Subscription and billing | Sidebar, role permissions `manage_settings`, `manage_billing` | Confirmation, then D04 | Phase 1 |
| D09 | Recall and revoke codes action | Role permission `recall_codes` exists but nothing uses it yet | Recall flow design | Phase 1 |
| D10 | "Download" next to code-generation entries in Recent activity | Overview, Recent activity | Linking an activity entry to its run | Phase 1 |
| D11 | Scheduled clean-up of expired code files | Code Management | Today files are removed only when someone opens Code Management; add a scheduled job | Before launch |
| D12 | Product and batch review by Super Admin ("Pending review") | Products, Batches | Super Admin app; today products and batches register instantly | Phase 1, Week 12 |
| D13 | Company approval from the Super Admin app | Register your Company | Super Admin app; today approved by hand with SQL | Phase 1, Week 12 |
| D14 | Subscription notifications and security notifications | Notifications | Billing (D04) and a security event source | With D04 |
| D15 | Test-print the label PDF on the real label stock | Code Management | Pilot manufacturer and label stock | Before first print |
