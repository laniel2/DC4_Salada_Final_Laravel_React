<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Payment extends Model {
 use HasFactory;
 protected $fillable = ["order_id", "amount", "payment_date", "method", "status", "reference_number", "proof_image_path"];
 public function order(){return $this->belongsTo(Order::class);}
}
