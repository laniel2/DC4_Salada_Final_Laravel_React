<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
class PaymentController extends Controller {
 public function index(Request $request) { return response()->json(Payment::query()->with('order')->latest()->paginate(10)); }
 public function store(Request $request) { $data=$request->validate(['order_id'=>'required|exists:orders,id','amount'=>'required|numeric|min:0.01','payment_date'=>'required|date','method'=>'required|string|max:50']); return response()->json(Payment::create($data),201); }
 public function show(Payment $payment) { return response()->json($payment); }
 public function update(Request $request, Payment $payment) { $data=$request->validate(['order_id'=>'sometimes|required|exists:orders,id','amount'=>'sometimes|required|numeric|min:0.01','payment_date'=>'sometimes|required|date','method'=>'sometimes|required|string|max:50']); $payment->update($data); return response()->json($payment->fresh()); }
 public function destroy(Payment $payment) { $payment->delete(); return response()->noContent(); }
}
