<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Measurement extends Model {
 use HasFactory;
 protected $fillable = ["customer_id", "garment", "details"];
 public function customer(){return $this->belongsTo(Customer::class);}
}
