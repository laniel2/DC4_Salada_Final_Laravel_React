<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
class OrderController extends Controller {
 public function index(Request $request) {
  $filters = $request->validate([
   'search' => 'sometimes|nullable|string|max:255',
   'status' => 'sometimes|nullable|in:Pending,In Progress,Ready for Fitting,Ready for Pickup,Completed,Cancelled',
   'due_date' => 'sometimes|nullable|date',
  ]);
  $orders = Order::with(['customer','user','items.service','payments'])
   ->when($request->user()->role === 'staff', fn ($query) => $query->where('user_id', $request->user()->id))
   ->when($filters['status'] ?? null,fn($q,$status)=>$q->where('status',$status))
   ->when($filters['search'] ?? null,fn($q,$search)=>$q->where(function ($matches) use ($search) {
    $matches->whereHas('customer', fn ($customer) => $customer
     ->where('name','like',"%$search%")
     ->orWhere('phone','like',"%$search%"))
     ->orWhere('notes','like',"%$search%")
     ->orWhereHas('items', fn ($items) => $items
      ->where('garment','like',"%$search%")
      ->orWhereHas('service', fn ($service) => $service->where('name','like',"%$search%")));
   }))
   ->when($filters['due_date'] ?? null,fn($q,$dueDate)=>$q->whereDate('due_date',$dueDate))
   ->latest()->paginate(10);

  return OrderResource::collection($orders);
 }
 public function store(Request $request) {
  $data=$request->validate(['customer_id'=>'required|exists:customers,id','user_id'=>'nullable|exists:users,id','order_date'=>'required|date','due_date'=>'required|date|after_or_equal:order_date','status'=>'nullable|in:Pending,In Progress,Ready for Fitting,Ready for Pickup,Completed,Cancelled','total_amount'=>'required|numeric|min:0','notes'=>'nullable|string']);
  $this->ensureAssignedUserIsStaff($data['user_id'] ?? null);
  $assignedUserId = $data['user_id'] ?? User::query()
   ->where('role', 'staff')
   ->withCount('orders')
   ->orderBy('orders_count')
   ->orderBy('id')
   ->first()?->id;
  if ($assignedUserId === null) {
   throw ValidationException::withMessages(['user_id' => ['Create a staff account before adding an order.']]);
  }
  $data['user_id'] = $assignedUserId;
  return (new OrderResource(Order::create($data)->load(['customer','user','items.service','payments'])))->response()->setStatusCode(201);
 }
 public function show(Request $request, Order $order) {
  $this->ensureStaffAssignment($request, $order);

  return new OrderResource($order->load(['customer','user','items.service','payments']));
 }
 public function referenceImage(Request $request, Order $order) {
  $this->ensureStaffAssignment($request, $order);
  abort_unless($order->reference_image_path && Storage::disk('local')->exists($order->reference_image_path), 404);
  return Storage::disk('local')->response($order->reference_image_path);
 }
 public function update(Request $request, Order $order) {
  $data=$request->validate(['customer_id'=>'sometimes|required|exists:customers,id','user_id'=>'sometimes|required|exists:users,id','order_date'=>'sometimes|required|date','due_date'=>'sometimes|required|date','status'=>'sometimes|required|in:Pending,In Progress,Ready for Fitting,Ready for Pickup,Completed,Cancelled','total_amount'=>'sometimes|required|numeric|min:0','notes'=>'nullable|string']);
  if (array_key_exists('user_id', $data)) {
   $this->ensureAssignedUserIsStaff($data['user_id']);
  }
  $order->update($data); return new OrderResource($order->fresh()->load(['customer','user','items.service','payments']));
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
