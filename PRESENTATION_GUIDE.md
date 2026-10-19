# TailorDesk Client Presentation

## Opening

“TailorDesk helps customers request tailoring work and lets the shop track each
job from request through pickup. Customers, tailors, and admins each have a
workspace for the work they need to do.”

## Live walkthrough

1. Sign in as a customer. Show the welcome message, saved contact details, and
   the **Edit contact details** action.
2. Request an alteration, dressmaking, or uniform service. Add the item details,
   due date, tailor instructions, and an optional reference photo. Submit the
   request and point out its pending status and estimated balance.
3. Sign in as staff. Find the incoming job with keyword search and the status
   filter. Open its reference photo, review the instructions, and update its
   progress.
4. Sign in as admin. Show the dashboard, the order and customer details, and
   account management. Explain that admins can review shop-wide orders while
   staff see their assigned jobs.
5. Return to the customer account and show the order status and payment history.

## Technical summary

- Laravel validates incoming data and returns validation errors with HTTP 422.
- Eloquent relationships connect customers, accounts, orders, services, order
  items, measurements, and payments. Migrations create and evolve the schema.
- Laravel API Resources shape order responses. Sanctum protects API access, and
  backend role middleware enforces admin, staff, and customer permissions.
- React Router selects each role’s workspace. React Context keeps authentication
  state, and shared components display messages and reference images.
- The customer’s GCash selection records a payment preference only. The shop
  confirms payment details and records received payments; no payment gateway is
  connected.

## Checkpoint evidence

The repository cannot establish whether checkpoint submissions were completed
on time. Fill this in from the actual course submissions and commit history.

| Checkpoint | Submission date | Evidence / commit |
| --- | --- | --- |
| CP1 |  |  |
| CP2 |  |  |
| CP3 |  |  |
