<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Customer extends Model {
 use HasFactory;
 protected $fillable = ["name", "phone", "address"];
 public function measurements(){return $this->hasMany(Measurement::class);} public function orders(){return $this->hasMany(Order::class);}
}
