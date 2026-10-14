<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::create('orders', function (Blueprint $table) { $table->id(); $table->foreignId('customer_id')->constrained()->restrictOnDelete(); $table->foreignId('user_id')->constrained('users')->restrictOnDelete(); $table->date('order_date'); $table->date('due_date'); $table->enum('status',['Pending','In Progress','Ready for Fitting','Ready for Pickup','Completed','Cancelled'])->default('Pending'); $table->decimal('total_amount',10,2)->default(0); $table->text('notes')->nullable(); $table->timestamps(); }); }
 public function down(): void { Schema::dropIfExists('orders'); }
};
