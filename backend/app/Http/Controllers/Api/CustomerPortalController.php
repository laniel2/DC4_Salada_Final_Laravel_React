<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerPortalController extends Controller
{
    public function profile(Request $request)
    {
        return response()->json($this->customerUser($request)->load('customer'));
    }

    public function updateProfile(Request $request)
    {
        $user = $this->customerUser($request);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'phone' => 'sometimes|nullable|string|max:30',
            'address' => 'sometimes|nullable|string',
        ]);

        DB::transaction(function () use ($user, $data) {
            $user->update(array_intersect_key($data, array_flip(['name', 'email'])));
            $user->customer->update(array_intersect_key($data, array_flip(['name', 'phone', 'address'])));
        });

        return response()->json($user->fresh()->load('customer'));
    }

    public function orders(Request $request)
    {
        $customer = $this->customerUser($request)->customer;
        $orders = $customer->orders()
            ->with(['items.service', 'payments'])
            ->latest()
            ->paginate(10);

        $orders->getCollection()->transform(function (Order $order) {
            $paid = (float) $order->payments->sum('amount');
            $order->setAttribute('payments_total', $paid);
            $order->setAttribute(
                'remaining_balance',
                max(0, (float) $order->total_amount - $paid)
            );

            return $order;
        });

        return response()->json($orders);
    }

    public function payments(Request $request)
    {
        $customer = $this->customerUser($request)->customer;
        $payments = Payment::query()
            ->whereHas('order', fn ($query) => $query->where('customer_id', $customer->id))
            ->with(['order.payments'])
            ->latest()
            ->paginate(10);

        $payments->getCollection()->transform(function (Payment $payment) {
            $order = $payment->order;
            $paid = (float) $order->payments->sum('amount');
            $payment->setAttribute(
                'order_remaining_balance',
                max(0, (float) $order->total_amount - $paid)
            );

            return $payment;
        });

        return response()->json($payments);
    }

    private function customerUser(Request $request)
    {
        $user = $request->user()->load('customer');
        abort_unless($user->customer, 403, 'Customer profile is not linked to this account.');

        return $user;
    }
}
