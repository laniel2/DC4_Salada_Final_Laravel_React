<?php
use Illuminate\Support\Facades\Route;
Route::get('/', fn () => response()->json(['app' => 'Tailoring Management API', 'status' => 'running']));
