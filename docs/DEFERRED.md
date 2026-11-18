# Deferred items (left out on purpose, to build later)

Things the designs show, or the plan calls for, that are **not built yet** and why. Nothing here is forgotten:
each has a visible reminder in the product (a "Not connected yet" card, a "Soon" item) or a
`DEFERRED(Dxx)` comment in the code. Search for `DEFERRED(` to find them. When one is built, delete its row
and its reminder.

| ID | What | Where it shows | Waiting for | Planned |
|----|------|----------------|-------------|---------|
| D02 | Top scan locations | Manufacturer Overview | Scans carry only a rough location when a customer opts in, and there is no place lookup to turn it into city names | Phase 1, Week 11 |
| D03 | "Suspected counterfeit scans" count and review link | Manufacturer Overview, Needs attention and Scan activity note | Fraud rules, alerts and cases (today only repeat scans are counted) | Phase 1, Week 11 |
| D04 | Plan and usage: plan name, monthly code allowance, batch declaration limit, usage bar | Sidebar plan card, Overview "Codes generated this month", Settings > Subscription & usage | Plans and billing; payment gateway not chosen yet | Phase 1, Week 10 |
| D05 | Seat limit on the team ("7 of 10 seats") | Team Management | Plans and billing (D04) | With D04 |
| D06 | Invitations sent by e-mail automatically | Team Management, Invite member | A custom e-mail service (SMTP); for now the administrator copies the link | When SMTP is set up |
| D08 | Billing tab: payment method, billing contact, invoices | Settings > Billing (`manage_billing`) | Payment gateway decision, then D04 | Phase 1 |
| D11 | Scheduled clean-up of expired code files | Code Management | Today files are removed only when someone opens Code Management; add a scheduled job | Before launch |
| D12 | Product and batch review by Super Admin ("Pending review") | Products, Batches | Super Admin app; today products and batches register instantly | Phase 1, Week 12 |
| D13 | Company approval from the Super Admin app | Register your Company | Super Admin app; today approved by hand with SQL | Phase 1, Week 12 |
| D14 | Subscription notifications and security notifications | Notifications | Billing (D04) and a security event source | With D04 |
| D15 | Test-print the label PDF on the real label stock | Code Management | Pilot manufacturer and label stock | Before first print |
| D16 | Blocked and Failed outcomes, and an Outcomes filter, in Audit Logs | Audit Logs table | Recording refused and failed actions, not only successes | Phase 1 |
| D17 | Security events (blocked sign-ins, devices), printing and reconciliation, SKANPROOV review events in Audit Logs | Audit Logs | Device tracking, print reconciliation and the Super Admin review exist first | Phase 1 |
| D18 | Company profile: "Request a change" (documents reviewed by SKANPROOV) and the account ID | Settings > Company profile | Change-request flow in the Super Admin app; account numbering | Phase 1 |
| D19 | Manufacturing facilities list with licence status | Settings > Company profile | Facilities are not recorded anywhere yet | Phase 1 |
| D20 | Changing the primary contact e-mail, with verification | Settings > Contact details | E-mail sending (SMTP) | Phase 1 |
| D21 | Trusted devices, session timeout, company-wide two-factor requirement, blocked sign-in alerts, "password last changed"; two-factor is not required for code generation or exports yet | Settings > Security & MFA | Device tracking; decision on making two-factor mandatory | Phase 1 |
| D22 | Notification preferences per category, in-app and e-mail | Settings > Preferences | Per-person notifications (they are company-wide today) and e-mail sending | Phase 1 |
| D23 | Regional settings: time zone and date format | Settings > Preferences | Applying a per-person setting across the portal (fixed to Nigerian time today) | Later |
