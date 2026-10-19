<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
class DashboardController extends Controller {
 public function __invoke() {
  return response()->json([
   'total_orders'=>Order::count(),
   'pending_orders'=>Order::whereIn('status',['Pending','In Progress','Ready for Fitting','Ready for Pickup'])->count(),
   'due_soon'=>Order::whereNotIn('status',['Completed','Cancelled'])->whereBetween('due_date',[now()->toDateString(),now()->addDays(3)->toDateString()])->count(),
   'completed_orders'=>Order::where('status','Completed')->count(),
   'payments_received'=>(float)Payment::where('status','Confirmed')->sum('amount')
  ]);
 }
}
