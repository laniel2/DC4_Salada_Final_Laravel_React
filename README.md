# Tailoring Management System

A local tailoring shop management app with a React/Vite frontend and Laravel 12 JSON API backed by MySQL/MariaDB. It supports admin, staff, and customer workspaces, order tracking, measurements, payments, and GCash payment proof review.

## Requirements

- Windows 10/11 (commands below use PowerShell), macOS, or Linux
- PHP 8.2+, Composer, Node.js LTS with npm
- MySQL or MariaDB

## Install and run locally

Open three terminals from the repository root. Create a MySQL database named `tailoring_management` first (for example in phpMyAdmin or with your MySQL client). Configure the database credentials in `backend/.env`.

### 1. Backend and database

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Edit `backend/.env` and set `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` for your database. The example defaults target a local MySQL server with database `tailoring_management`, user `root`, and a blank password.

```powershell
php artisan migrate --seed
php artisan serve
```

The API is now at `http://127.0.0.1:8000/api`. The seeder creates sample services, customers, measurements, orders, payments, and the admin/staff accounts listed below. `migrate --seed` is intended for a fresh/demo database; the seeder uses repeat-safe records for most sample data, and resets the seeded admin/staff passwords to `password` each time it runs.

### 2. Frontend

In another terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`). Set `VITE_API_URL` in `frontend/.env` if the API is hosted somewhere else. To show the shop’s GCash QR code, place its image under `frontend/public`, set `VITE_GCASH_QR_URL` to its public path (for example `/gcash-qr.png`), then restart Vite.

Laravel CORS allows the origin in `backend/.env` `FRONTEND_URL` (default `http://localhost:5173`). If you change Vite’s port, update that value and restart Laravel. Clear Laravel’s cached settings with `php artisan optimize:clear` after changing backend configuration.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password` |
| Staff | `staff@example.com` | `password` |

Customers can register from the app’s registration page. Public registration always creates a customer role; the demo seeder does not create a customer login. The seeded customer/order rows are sample shop records, not sign-in accounts.

These credentials are for local demonstration only. Change or remove them before exposing the application to other users or using real customer data. Do not run the demo seeder against a production database.

## API documentation

Base URL: `http://127.0.0.1:8000/api`. Requests and responses use JSON unless an endpoint uploads/returns an image. Send `Accept: application/json`; for protected routes send `Authorization: Bearer <token>`. Login and registration return `{ "token": "…", "user": { ... } }`. Validation failures use Laravel’s standard `422` JSON response; unauthenticated requests return `401`, and insufficient role returns `403`.

### Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create customer login and linked customer profile. Required: `name`, `email`, `password`, `password_confirmation`; optional `phone`, `address`. Password minimum 8 characters. |
| POST | `/login` | Public | Validate `email` and `password`; returns a Sanctum personal access token and user. |
| GET | `/user` | Any signed-in user | Return current user and linked customer profile, if any. |
| POST | `/logout` | Any signed-in user | Revoke the current token. |

### Role-specific endpoints

`{id}` parameters are database IDs. List endpoints are paginated (usually 10 records/page); pass `page` to select a page. Admin has full shop-record access. Staff can read shop records and update progress on assigned jobs. Customers access only their own account, orders, and payments.

| Method | Path | Access | Purpose / fields |
| --- | --- | --- | --- |
| GET, POST | `/admin/accounts` | Admin | List accounts (paginated); create staff/customer account. Create fields: `name`, `email`, `password`, `password_confirmation`, `role` (`staff` or `customer`); optional customer `phone`, `address`. |
| GET, PATCH, DELETE | `/admin/accounts/{id}` | Admin | View, update profile/email and optional password, or delete staff/customer account. Admin accounts cannot be managed through this resource. |
| GET | `/dashboard` | Admin | Shop dashboard metrics. |
| GET | `/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` | Admin | Confirmed payment sales report for an optional date range. |
| GET, POST, PATCH, DELETE | `/customers`, `/customers/{id}` | Admin | Customer CRUD (list/show are also available to staff). Customer fields include `name`, `phone`, `address`. |
| GET, POST, PATCH, DELETE | `/services`, `/services/{id}` | Admin | Service CRUD (list/show are also available to staff and customers via their portal). Fields: `name`, optional `description`, `base_price`. |
| GET, POST, PATCH, DELETE | `/orders`, `/orders/{id}` | Admin | Order CRUD (list/show also available to staff, restricted to assigned orders). Create fields include `customer_id`, optional `user_id` (staff account), `order_date`, `due_date`, optional `status`, `total_amount`, `notes`. Staff assignment defaults to the staff member with the fewest orders. |
| PATCH | `/orders/{id}/status` | Admin, assigned staff | Set order status. Staff may set `In Progress`, `Ready for Fitting`, `Ready for Pickup`, or `Completed`; admin may also set `Pending` and `Cancelled`. |
| GET | `/orders/{id}/reference-image` | Admin, assigned staff, owning customer | Stream private order reference image if present. |
| GET, POST, PATCH, DELETE | `/order-items`, `/order-items/{id}` | Admin | Order item CRUD. Fields: `order_id`, `service_id`, `garment`, `quantity`, `price`. |
| GET, POST, PATCH, DELETE | `/measurements`, `/measurements/{id}` | Admin | Measurement CRUD (list/show also available to staff). Fields: `customer_id`, optional `garment`, `details` object. |
| GET, POST, PATCH, DELETE | `/payments`, `/payments/{id}` | Admin | Payment CRUD. Fields include `order_id`, `amount`, `payment_date`, `method`, optional `status` (`Pending Verification`, `Confirmed`, `Rejected`) and `reference_number`. |
| GET | `/payments/{id}/proof` | Admin | Stream private payment proof image if present. |
| GET, PATCH | `/customer/profile` | Customer | Read/update own user/contact profile (`name`, `email`, `phone`, `address`). |
| GET | `/customer/orders` | Customer | List own orders and payment balance data. |
| GET | `/customer/orders/{id}/reference-image` | Owning customer | Stream own private order reference image. |
| GET | `/customer/payments` | Customer | List payments belonging to own orders. |
| GET | `/customer/services` | Customer | List available services. |
| POST | `/customer/orders` | Customer | Request order. Fields: `service_id`, `garment`, `quantity` (1–100), future/current `due_date`, `payment_preference` (`Pay in person` or `GCash`); optional `notes`, `reference_image` (image, up to 5 MB). |
| POST | `/customer/orders/{id}/payments` | Owning customer | Submit GCash proof for a GCash order. Fields: `amount`, `reference_number`, `proof_image` (image, up to 5 MB). Payment remains `Pending Verification` until shop admin confirms/rejects it. |

For order list filtering, staff/admin can pass `search`, `status`, `due_date`, and `page` to `GET /orders`. Order and payment resources omit stored file paths; they expose `has_reference_image` / `has_proof_image`. Customers see their remaining order balance based on confirmed payments.

### Postman

Import `backend/postman/Tailoring-Management-System.postman_collection.json` and `backend/postman/Tailoring-Management-System.postman_environment.json` into Postman, select the environment, and run the collection against a running API after seeding. The collection exercises authentication, role boundaries, CRUD, customer ordering/payment flows, and cleanup of its test records. Adjust `baseUrl` if needed.

## How data and admin pages are secured

- **The API enforces access.** Protected routes use Laravel Sanctum bearer tokens (`auth:sanctum`) and role middleware. Admin-only actions are checked on the server; hiding a page or changing a URL in React does not grant API access.
- **Roles are assigned on the server.** Public registration does not accept a role and creates only `customer`. Account-management endpoints are admin-only and allow creation of `staff` or `customer`, not another admin.
- **Staff access is scoped.** Staff order lists and individual order/image access are limited to jobs assigned to that staff account. Staff status updates are limited to allowed progress states.
- **Customer records are scoped.** Customer profile, order, payment, and reference-image endpoints derive the customer from the authenticated user and check ownership. Unowned orders/images are rejected (often as `404` to avoid revealing their existence).
- **Uploads are private.** Reference images and payment proofs are stored on Laravel’s private `local` disk, not in the public web directory. They are streamed only through authenticated, authorized routes. Upload validation requires an image and caps size at 5 MB.
- **Passwords are hashed.** Laravel’s `hashed` model cast hashes new/changed passwords; login verifies them with Laravel hashing. Tokens are stored server-side by Sanctum and logout deletes the current token.
- **Admin UI route checks are a convenience layer.** React redirects non-admin users away from `/manage` and `/accounts`, but server middleware is the actual authorization boundary.

### Deployment notes

The local demo configuration is not production-hardened. Before deployment, use HTTPS, set `APP_ENV=production` and `APP_DEBUG=false`, use a strong private database credential and application key, remove/change seeded demo credentials and sample data, and restrict CORS to the real frontend origin. The frontend currently keeps its bearer token in browser `localStorage`, which can be exposed by a successful same-origin script injection; use a carefully configured secure, HttpOnly cookie/session approach if that risk is unsuitable. Back up the database and private upload storage together and restrict filesystem/server access to both.

## Troubleshooting

- `php` is not recognized: add the PHP installation (for example `C:\xampp\php`) to PATH or use its supplied terminal.
- `could not find driver`: enable `pdo_mysql` in the PHP executable’s active `php.ini` (`php --ini` shows its path).
- `No application encryption key`: run `php artisan key:generate` inside `backend`.
- `Unknown database` or missing tables: create the database, then run `php artisan migrate --seed`.
- `401 Unauthorized`: sign in again; the frontend removes the stored token when the API returns 401.
- Browser CORS error: ensure the frontend origin matches `FRONTEND_URL` in `backend/.env` and restart the API.
