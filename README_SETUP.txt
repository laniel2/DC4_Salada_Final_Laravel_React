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
Change these passwords before using real customer data.

SETUP PART 3 — FRONTEND
1. Open a second PowerShell terminal at the extracted folder:
   cd frontend
2. Install packages:
   npm install
3. Start React:
   npm run dev
4. Open the URL shown by Vite (normally http://localhost:5173).
5. Log in using one of the sample accounts above.

API / POSTMAN
- POST /api/login { "email": "admin@example.com", "password": "password" }
- GET /api/user (Bearer token)
- GET /api/customers (Bearer token)
- GET /api/services (Bearer token)
- GET /api/orders (Bearer token)
- GET /api/dashboard (Bearer token)
- POST /api/logout (Bearer token)

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
