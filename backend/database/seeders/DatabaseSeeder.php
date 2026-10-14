<?php
namespace Database\Seeders;
use App\Models\User;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Measurement;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class DatabaseSeeder extends Seeder {
 public function run(): void {
  $admin=User::updateOrCreate(['email'=>'admin@example.com'],['name'=>'Shop Admin','password'=>Hash::make('password'),'role'=>'admin']);
  $staff=User::updateOrCreate(['email'=>'staff@example.com'],['name'=>'Sample Tailor','password'=>Hash::make('password'),'role'=>'staff']);
  $services=[];
  foreach ([['Uniform Sewing',850],['Alteration',250],['Dressmaking',1200],['T-Shirt Printing',350],['Fabric Cutting',150]] as [$name,$price]) $services[] = Service::firstOrCreate(['name'=>$name],['base_price'=>$price,'description'=>'Tailoring shop service']);
  for($i=1;$i<=20;$i++){
   $customer=Customer::create(['name'=>'Sample Customer '.$i,'phone'=>'09'.str_pad((string)(100000000+$i),9,'0',STR_PAD_LEFT),'address'=>'Sample Address '.$i]);
   Measurement::create(['customer_id'=>$customer->id,'garment'=>'Uniform','details'=>['chest'=>36+$i,'waist'=>28+$i,'hips'=>36+$i,'sleeve'=>22]]);
   $order=Order::create(['customer_id'=>$customer->id,'user_id'=>$i%2?$admin->id:$staff->id,'order_date'=>now()->subDays($i)->toDateString(),'due_date'=>now()->addDays($i%7+1)->toDateString(),'status'=>$i%4===0?'Completed':($i%3===0?'In Progress':'Pending'),'total_amount'=>$services[0]->base_price,'notes'=>'Sample order']);
   OrderItem::create(['order_id'=>$order->id,'service_id'=>$services[0]->id,'garment'=>'School uniform','quantity'=>1,'price'=>$services[0]->base_price]);
   if($i%2===0) Payment::create(['order_id'=>$order->id,'amount'=>200,'payment_date'=>now()->toDateString(),'method'=>'Cash']);
  }
 }
}
