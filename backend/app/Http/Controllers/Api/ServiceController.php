<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
class ServiceController extends Controller {
 public function index(Request $request) { return response()->json(Service::query()->latest()->paginate(10)); }
 public function store(Request $request) { $data=$request->validate(['name'=>'required|string|max:255','description'=>'nullable|string','base_price'=>'required|numeric|min:0']); return response()->json(Service::create($data),201); }
 public function show(Service $service) { return response()->json($service); }
 public function update(Request $request, Service $service) { $data=$request->validate(['name'=>'sometimes|required|string|max:255','description'=>'nullable|string','base_price'=>'sometimes|required|numeric|min:0']); $service->update($data); return response()->json($service->fresh()); }
 public function destroy(Service $service) { $service->delete(); return response()->noContent(); }
}
