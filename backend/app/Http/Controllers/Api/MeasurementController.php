<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Measurement;
use Illuminate\Http\Request;
class MeasurementController extends Controller {
 public function index(Request $request) { return response()->json(Measurement::query()->with('customer')->latest()->paginate(10)); }
 public function store(Request $request) { $data=$request->validate(['customer_id'=>'required|exists:customers,id','garment'=>'nullable|string|max:255','details'=>'required|array']); return response()->json(Measurement::create($data),201); }
 public function show(Measurement $measurement) { return response()->json($measurement); }
 public function update(Request $request, Measurement $measurement) { $data=$request->validate(['customer_id'=>'sometimes|required|exists:customers,id','garment'=>'nullable|string|max:255','details'=>'sometimes|required|array']); $measurement->update($data); return response()->json($measurement->fresh()); }
 public function destroy(Measurement $measurement) { $measurement->delete(); return response()->noContent(); }
}
