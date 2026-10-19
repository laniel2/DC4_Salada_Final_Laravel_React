<?php

use App\Http\Controllers\Api\AdminAccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerPortalController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MeasurementController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SalesReportController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('accounts', AdminAccountController::class);
        Route::get('/reports/sales', SalesReportController::class);
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/dashboard', DashboardController::class);
        Route::apiResource('customers', CustomerController::class)->except(['index', 'show']);
        Route::apiResource('services', ServiceController::class)->except(['index', 'show']);
        Route::apiResource('orders', OrderController::class)->except(['index', 'show']);
        Route::apiResource('order-items', OrderItemController::class);
        Route::apiResource('measurements', MeasurementController::class)->except(['index', 'show']);
        Route::apiResource('payments', PaymentController::class);
        Route::get('/payments/{payment}/proof', [PaymentController::class, 'proof']);
    });

    Route::middleware('role:admin|staff')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);

        Route::get('/services', [ServiceController::class, 'index']);
        Route::get('/services/{service}', [ServiceController::class, 'show']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::get('/orders/{order}/reference-image', [OrderController::class, 'referenceImage']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

        Route::get('/measurements', [MeasurementController::class, 'index']);
        Route::get('/measurements/{measurement}', [MeasurementController::class, 'show']);
    });

    Route::middleware('role:customer')->prefix('customer')->group(function () {
        Route::get('/profile', [CustomerPortalController::class, 'profile']);
        Route::patch('/profile', [CustomerPortalController::class, 'updateProfile']);
        Route::get('/orders', [CustomerPortalController::class, 'orders']);
        Route::get('/orders/{order}/reference-image', [CustomerPortalController::class, 'referenceImage']);
        Route::get('/payments', [CustomerPortalController::class, 'payments']);
        Route::get('/services', [CustomerPortalController::class, 'services']);
        Route::post('/orders', [CustomerPortalController::class, 'storeOrder']);
        Route::post('/orders/{order}/payments', [CustomerPortalController::class, 'storeGcashPayment']);
    });
});
