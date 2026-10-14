<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::query()
            ->withCount(['orders', 'measurements'])
            ->when(
                $request->search,
                fn ($query, $search) => $query
                    ->where(function ($searchQuery) use ($search) {
                        $searchQuery
                            ->where('name', 'like', "%$search%")
                            ->orWhere('phone', 'like', "%$search%");
                    })
            )
            ->latest()
            ->paginate(10);

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
        ]);

        return response()->json(Customer::create($data), 201);
    }

    public function show(Customer $customer)
    {
        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
        ]);

        $customer->update($data);

        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->noContent();
    }
}
