<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Order extends Model {
 use HasFactory;
 protected $fillable = ["customer_id", "user_id", "order_date", "due_date", "status", "total_amount", "notes"];
 public function customer(){return $this->belongsTo(Customer::class);} public function user(){return $this->belongsTo(User::class);} public function items(){return $this->hasMany(OrderItem::class,'order_id');} public function payments(){return $this->hasMany(Payment::class);}
}
