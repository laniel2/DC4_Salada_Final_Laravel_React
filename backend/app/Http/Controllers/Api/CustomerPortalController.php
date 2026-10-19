<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

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

    public function services()
    {
        return response()->json(Service::query()->orderBy('name')->get());
    }

    public function storeOrder(Request $request)
    {
        $data = $request->validate([
            'service_id' => 'required|exists:services,id',
            'garment' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1|max:100',
            'due_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string|max:5000',
            'payment_preference' => 'required|in:Pay in person,GCash',
            'reference_image' => 'nullable|image|max:5120',
        ]);

        $customer = $this->customerUser($request)->customer;
        $service = Service::findOrFail($data['service_id']);
        $assignedStaff = User::query()
            ->where('role', 'staff')
            ->withCount('orders')
            ->orderBy('orders_count')
            ->orderBy('id')
            ->first();

        if (!$assignedStaff) {
            throw ValidationException::withMessages([
                'service_id' => ['The shop cannot accept online requests right now. Please contact the shop directly.'],
            ]);
        }

        $imagePath = $request->file('reference_image')?->store('order-references', 'local');
        try {
            $order = DB::transaction(function () use ($customer, $assignedStaff, $service, $data, $imagePath) {
                $order = Order::create([
                    'customer_id' => $customer->id,
                    'user_id' => $assignedStaff->id,
                    'order_date' => now()->toDateString(),
                    'due_date' => $data['due_date'],
                    'status' => 'Pending',
                    'total_amount' => (float) $service->base_price * $data['quantity'],
                    'notes' => $data['notes'] ?? null,
                    'payment_preference' => $data['payment_preference'],
                    'reference_image_path' => $imagePath,
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'service_id' => $service->id,
                    'garment' => $data['garment'],
                    'quantity' => $data['quantity'],
                    'price' => $service->base_price,
                ]);

                return $order;
            });
        } catch (\Throwable $error) {
            if ($imagePath) Storage::disk('local')->delete($imagePath);
            throw $error;
        }

        return response()->json(
            $order->load(['customer', 'user', 'items.service', 'payments']),
            201
        );
    }

    public function referenceImage(Request $request, Order $order)
    {
        abort_unless($order->customer_id === $this->customerUser($request)->customer->id, 404);
        abort_unless($order->reference_image_path && Storage::disk('local')->exists($order->reference_image_path), 404);

        return Storage::disk('local')->response($order->reference_image_path);
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
