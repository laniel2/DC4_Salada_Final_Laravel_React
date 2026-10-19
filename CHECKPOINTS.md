# Project Checkpoints

## CP2 — Backend Build (End of Day 6)

### Implementation

- [x] Database migrations define the core tables, foreign keys, customer account
  roles, and order payment/reference-image fields.
- [x] Eloquent models define the customer, user, order, item, service,
  measurement, and payment relationships.
- [x] `DatabaseSeeder` creates admin/staff demo logins, services, and sample
  tailoring records. Sample records use `firstOrCreate` so rerunning the seeder
  does not keep duplicating them.
- [x] Sanctum login, registration, current-user, and logout endpoints are
  available. Role middleware protects admin, staff, and customer routes.
- [x] CRUD endpoints validate input and return appropriate status codes,
  including `201 Created`, `204 No Content`, and validation errors with `422`.
- [x] Order endpoints serialize through Laravel API Resources.

### Postman artifacts and verification

The exported Postman collection and its local environment are checked in here:

- `backend/postman/Tailoring-Management-System.postman_collection.json`
- `backend/postman/Tailoring-Management-System.postman_environment.json`

The collection contains 71 requests with response assertions for authentication,
CRUD operations, customer/staff/admin access, and cleanup. The order creation
assertion reads the ID from the Laravel API Resource response.

To record the required Postman verification for submission:

1. Start MySQL and run `php artisan migrate --seed` from `backend/`.
2. Start the API with `php artisan serve`.
3. Import both Postman files, select **Tailoring Management System Local**, and
   run the collection from top to bottom.
4. Save the Postman Runner result or screenshot with your checkpoint evidence.

The collection is prepared in the repository; attach the actual Runner result
after executing it in Postman. Do not report a Postman run as passed until the
Runner shows all requests successful.
