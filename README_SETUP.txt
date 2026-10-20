TAILORING MANAGEMENT SYSTEM (React + Laravel + MySQL)
=====================================================

REQUIREMENTS
- Windows 10/11
- PHP 8.2+, Composer
- Node.js LTS + npm
- MySQL/MariaDB (XAMPP is fine)
- VS Code recommended

PROJECT STRUCTURE
- frontend/  React + Vite SPA
- backend/   Laravel API starter files (Laravel 12)
- CHECKPOINTS.md  CP2 implementation summary and Postman evidence steps

IMPORTANT
This is a functional starter project for your mini-capstone. Authentication,
customers, services, orders, measurements, payments, dashboard, role middleware,
and API scaffolding are included. Review and test it locally, especially before
your presentation. It uses Laravel Sanctum API tokens.

SETUP PART 1 — DATABASE
1. Open XAMPP Control Panel and start Apache and MySQL.
2. Open http://localhost/phpmyadmin
3. Click New and create database: tailoring_management
4. Use the default XAMPP MySQL credentials (usually user root, blank password),
   or update backend/.env to match your own credentials.

SETUP PART 2 — BACKEND
1. Open PowerShell in the extracted folder, then:
   cd backend
2. Install PHP packages:
   composer install
3. Create the environment file:
   Copy-Item .env.example .env
4. Generate app key:
   php artisan key:generate
5. Edit backend/.env and set:
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=tailoring_management
   DB_USERNAME=root
   DB_PASSWORD=
6. Install Sanctum if it is not already installed:
   composer require laravel/sanctum
7. Run migrations and seed sample data:
   php artisan migrate --seed
8. Start the API:
   php artisan serve
   Keep this terminal open. API base URL: http://127.0.0.1:8000/api

If `routes/api.php` is missing, run `php artisan install:api` once, then keep the
provided routes/api.php file. If Composer reports a dependency issue, check that
`php -v` reports PHP 8.2 or newer and that Composer uses the same PHP executable.

Default seeded login:
  Admin: admin@example.com
  Password: password
  Staff: staff@example.com
  Password: password
  Staff: marco@example.com
  Password: password
  Customer: customer@example.com
  Password: password
The seeder also creates five additional customer accounts, all with password `password`.
Change these passwords before using real customer data.

SETUP PART 3 — FRONTEND
1. Open a second PowerShell terminal at the extracted folder:
   cd frontend
2. Install packages:
   npm install
3. To accept GCash payments, copy the shop's QR image into `frontend/public`
   and set `VITE_GCASH_QR_URL=/your-qr-file.png` in `frontend/.env`.
   Create `frontend/.env` from `.env.example` if it does not exist, then restart
   Vite after changing the setting.
4. Start React:
   npm run dev
5. Open the URL shown by Vite (normally http://localhost:5173).
6. Sign in with one of the sample accounts above, or choose **Create a customer
   account** to register a customer login.

FRONTEND ROLE WORKSPACES
- Admins land on the shop dashboard with daily sales and can manage staff and
  customer accounts from the Accounts link. The Shop records page provides CRUD
  forms for customers, services, orders, order items, measurements, and payments.
- Staff land on their assigned jobs page, where they can update progress,
  search customers, and view measurements.
- Customers land on their account page with a welcome message, can edit contact
  details and request a tailoring order with an optional private reference image.
  GCash requests continue to an order payment screen where customers scan the
  configured shop QR, submit a reference number and receipt image, and wait for
  admin verification. Only confirmed payments reduce the order balance or count
  toward sales. Requests are assigned to the staff member with the lightest
  order queue for review by the shop.

API / POSTMAN
- Import `backend/postman/Tailoring-Management-System.postman_collection.json`
  and `backend/postman/Tailoring-Management-System.postman_environment.json`
  into Postman. Select the imported local environment.
- Run the collection after `php artisan migrate --seed` and while the API is
  running. It tests registration, admin/staff/customer authorization, customer
  order and payment views, the main CRUD requests, then removes its test data.
- Set the environment's `baseUrl` variable if the Laravel API uses a different
  address. The default is `http://127.0.0.1:8000/api`.
- Authentication: `POST /api/register` creates a customer account;
  `POST /api/login`, `GET /api/user`, and `POST /api/logout` use Sanctum tokens.
- Admin: full CRUD for customers, services, orders, order items, measurements,
  and payments; account management at `/api/admin/accounts`; dashboard at
  `GET /api/dashboard`; date-filtered payment sales report at
  `GET /api/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- Tailor/staff: search and view customers, measurements, and services; view only
  assigned orders; update assigned order progress with
  `PATCH /api/orders/{order}/status`.
- Customer: view/update their own `/api/customer/profile`, `/api/customer/orders`,
  `/api/customer/payments`, and `/api/customer/services`; submit a service request
  with `POST /api/customer/orders` (optional `reference_image`, max 5 MB), then
  submit GCash proof to `POST /api/customer/orders/{order}/payments` (receipt image
  max 5 MB). Admins verify payments by changing their status in Shop records.
  Order reference images are served only to the customer who owns the order or the
  assigned shop team. Order and payment responses include the
  remaining balance. The payment preference is saved with the request; payment
  itself is confirmed and recorded by shop staff.
- All role-specific endpoints require a Bearer token. Staff/customer roles are
  assigned server-side; public registration cannot select a privileged role.

If the browser reports a CORS error, ensure Laravel is running on 127.0.0.1:8000
and check config/cors.php. Clear cached configuration with:
  php artisan optimize:clear

TROUBLESHOOTING
- `php is not recognized`: use the PHP terminal installed with XAMPP or add your
  PHP folder (for example C:\\xampp\\php) to PATH, then reopen PowerShell.
- `could not find driver`: enable pdo_mysql in the active php.ini, then restart
  the terminal. Check `php --ini` and `php -m`.
- `No application encryption key`: run `php artisan key:generate`.
- `Unknown database`: create tailoring_management in phpMyAdmin.
- `Table doesn't exist`: run `php artisan migrate --seed`.
- `401 Unauthorized`: log in again; frontend stores token in localStorage.
- If using another port for Vite, update backend/config/cors.php allowed_origins.

For your defense, be prepared to explain: React hooks, Axios interceptor, Sanctum
token authentication, Laravel migrations/models/relationships, validation,
role middleware, pagination, REST status codes, and CRUD.
