<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
class OrderController extends Controller {
 public function index(Request $request) {
  $orders = Order::with(['customer','user','items.service','payments'])
   ->when($request->user()->role === 'staff', fn ($query) => $query->where('user_id', $request->user()->id))
   ->when($request->status,fn($q,$s)=>$q->where('status',$s))
   ->when($request->search,fn($q,$s)=>$q->whereHas('customer',fn($c)=>$c->where('name','like',"%$s%")))
   ->when($request->due_date,fn($q,$d)=>$q->whereDate('due_date',$d))
   ->latest()->paginate(10);

  return response()->json($orders);
 }
 public function store(Request $request) {
  $data=$request->validate(['customer_id'=>'required|exists:customers,id','user_id'=>'nullable|exists:users,id','order_date'=>'required|date','due_date'=>'required|date|after_or_equal:order_date','status'=>'nullable|in:Pending,In Progress,Ready for Fitting,Ready for Pickup,Completed,Cancelled','total_amount'=>'required|numeric|min:0','notes'=>'nullable|string']);
  $this->ensureAssignedUserIsStaff($data['user_id'] ?? null);
  $data['user_id']=$data['user_id'] ?? $request->user()->id;
  return response()->json(Order::create($data)->load(['customer','user','items','payments']),201);
 }
 public function show(Request $request, Order $order) {
  $this->ensureStaffAssignment($request, $order);

  return response()->json($order->load(['customer','user','items.service','payments']));
 }
 public function update(Request $request, Order $order) {
  $data=$request->validate(['customer_id'=>'sometimes|required|exists:customers,id','user_id'=>'sometimes|required|exists:users,id','order_date'=>'sometimes|required|date','due_date'=>'sometimes|required|date','status'=>'sometimes|required|in:Pending,In Progress,Ready for Fitting,Ready for Pickup,Completed,Cancelled','total_amount'=>'sometimes|required|numeric|min:0','notes'=>'nullable|string']);
  if (array_key_exists('user_id', $data)) {
   $this->ensureAssignedUserIsStaff($data['user_id']);
  }
  $order->update($data); return response()->json($order->fresh()->load(['customer','user','items','payments']));
 }
 public function updateStatus(Request $request, Order $order) {
  $this->ensureStaffAssignment($request, $order);
  $allowedStatuses = $request->user()->role === 'staff'
   ? 'required|in:In Progress,Ready for Fitting,Ready for Pickup,Completed'
   : 'required|in:Pending,In Progress,Ready for Fitting,Ready for Pickup,Completed,Cancelled';
  $data=$request->validate(['status'=>$allowedStatuses]);
  $order->update($data); return response()->json($order);
 }
 public function destroy(Order $order) { $order->delete(); return response()->noContent(); }

 private function ensureStaffAssignment(Request $request, Order $order): void {
  abort_unless(
   $request->user()->role !== 'staff' || $order->user_id === $request->user()->id,
   403,
   'This tailoring job is assigned to another staff member.'
  );
 }

 private function ensureAssignedUserIsStaff(?int $userId): void {
  if ($userId !== null && !User::whereKey($userId)->where('role', 'staff')->exists()) {
   throw ValidationException::withMessages([
    'user_id' => ['Orders can only be assigned to staff accounts.'],
   ]);
  }
 }
}
