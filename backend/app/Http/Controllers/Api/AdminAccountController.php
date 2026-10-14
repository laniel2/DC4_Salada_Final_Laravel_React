<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAccountController extends Controller
{
    public function index()
    {
        return response()->json(
            User::query()
                ->with('customer')
                ->whereIn('role', ['staff', 'customer'])
                ->latest()
                ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:staff,customer',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
        ]);

        $account = DB::transaction(function () use ($data) {
            $attributes = [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
            ];

            if ($data['role'] === 'customer') {
                $customer = Customer::create([
                    'name' => $data['name'],
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                ]);
                $attributes['customer_id'] = $customer->id;
            }

            return User::create($attributes)->load('customer');
        });

        return response()->json($account, 201);
    }

    public function show(User $account)
    {
        abort_unless(in_array($account->role, ['staff', 'customer'], true), 404);

        return response()->json($account->load('customer'));
    }

    public function update(Request $request, User $account)
    {
        abort_unless(in_array($account->role, ['staff', 'customer'], true), 404);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$account->id,
            'password' => 'sometimes|required|string|min:8|confirmed',
            'phone' => 'sometimes|nullable|string|max:30',
            'address' => 'sometimes|nullable|string',
        ]);

        unset($data['password_confirmation']);

        DB::transaction(function () use ($account, $data) {
            $profileData = array_intersect_key($data, array_flip(['name', 'phone', 'address']));
            $accountData = array_intersect_key($data, array_flip(['name', 'email', 'password']));

            $account->update($accountData);

            if ($account->customer && $profileData) {
                $account->customer->update($profileData);
            }
        });

        return response()->json($account->fresh()->load('customer'));
    }

    public function destroy(User $account)
    {
        abort_unless(in_array($account->role, ['staff', 'customer'], true), 404);

        $account->tokens()->delete();
        $account->delete();

        return response()->noContent();
    }
}
