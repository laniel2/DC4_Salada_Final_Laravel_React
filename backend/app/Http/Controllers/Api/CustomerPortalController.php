<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use App\Support\ShopEmailNotifications;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CustomerPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        $orders = $this->customerUser($request)->customer->orders();

        return response()->json([
            'active_orders' => (clone $orders)->whereNotIn('status', ['Completed', 'Cancelled'])->count(),
            'completed_orders' => (clone $orders)->where('status', 'Completed')->count(),
            'open_balances' => (clone $orders)->whereRaw(
                'total_amount > (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payments.order_id = orders.id AND payments.status = ?)',
                ['Confirmed']
            )->count(),
        ]);
    }

    public function profile(Request $request)
    {
        $user = $this->customerUser($request)->load('customer');
        $user->setAttribute('has_profile_image', (bool) $user->profile_image_path);

        return response()->json($user);
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

    public function profileImage(Request $request)
    {
        $user = $this->customerUser($request);
        abort_unless($user->profile_image_path && Storage::disk('local')->exists($user->profile_image_path), 404);

        return Storage::disk('local')->response($user->profile_image_path);
    }

    public function updateProfileImage(Request $request)
    {
        $request->validate(['profile_image' => 'required|image|max:5120']);
        $user = $this->customerUser($request);
        $oldPath = $user->profile_image_path;
        $newPath = $request->file('profile_image')->store('customer-profile-images', 'local');

        try {
            $user->update(['profile_image_path' => $newPath]);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($newPath);
            throw $error;
        }

        if ($oldPath) Storage::disk('local')->delete($oldPath);

        return response()->json(['has_profile_image' => true]);
    }

    public function deleteProfileImage(Request $request)
    {
        $user = $this->customerUser($request);
        if ($user->profile_image_path) Storage::disk('local')->delete($user->profile_image_path);
        $user->update(['profile_image_path' => null]);

        return response()->noContent();
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string|current_password',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $this->customerUser($request)->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function orders(Request $request)
    {
        $customer = $this->customerUser($request)->customer;
        $orders = $customer->orders()
            ->with(['items.service', 'payments'])
            ->latest()
            ->paginate(10);

        $orders->getCollection()->transform(function (Order $order) {
            $paid = (float) $order->payments->where('status', 'Confirmed')->sum('amount');
            $order->setAttribute('payments_total', $paid);
            $order->setAttribute(
                'remaining_balance',
                max(0, (float) $order->total_amount - $paid)
            );

            return $order;
        });

        return OrderResource::collection($orders);
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

        ShopEmailNotifications::orderRequested($order);

        return (new OrderResource($order->load(['customer', 'user', 'items.service', 'payments'])))
            ->response()
            ->setStatusCode(201);
    }

    public function updateOrder(Request $request, Order $order)
    {
        $customer = $this->customerUser($request)->customer;
        abort_unless($order->customer_id === $customer->id, 404);
        abort_unless(
            $order->status === 'Pending' && !$order->payments()->exists(),
            403,
            'Only pending orders without payments can be changed.'
        );

        $data = $request->validate([
            'service_id' => 'required|exists:services,id',
            'garment' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1|max:100',
            'due_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string|max:5000',
            'payment_preference' => 'required|in:Pay in person,GCash',
        ]);

        $service = Service::findOrFail($data['service_id']);
        DB::transaction(function () use ($order, $data, $service) {
            $item = $order->items()->oldest('id')->firstOrFail();
            $item->update([
                'service_id' => $service->id,
                'garment' => $data['garment'],
                'quantity' => $data['quantity'],
                'price' => $service->base_price,
            ]);
            $order->update([
                'due_date' => $data['due_date'],
                'notes' => $data['notes'] ?? null,
                'payment_preference' => $data['payment_preference'],
                'total_amount' => $order->items()->sum(DB::raw('price * quantity')),
            ]);
        });

        return new OrderResource($order->fresh()->load(['customer', 'user', 'items.service', 'payments']));
    }

    public function deleteOrder(Request $request, Order $order)
    {
        $customer = $this->customerUser($request)->customer;
        abort_unless($order->customer_id === $customer->id, 404);
        abort_unless(
            $order->status === 'Pending' && !$order->payments()->exists(),
            403,
            'Only pending orders without payments can be deleted.'
        );

        $imagePath = $order->reference_image_path;
        DB::transaction(fn () => $order->delete());
        if ($imagePath) Storage::disk('local')->delete($imagePath);

        return response()->noContent();
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
            $paid = (float) $order->payments->where('status', 'Confirmed')->sum('amount');
            $payment->setAttribute(
                'order_remaining_balance',
                max(0, (float) $order->total_amount - $paid)
            );

            return $payment;
        });

        return PaymentResource::collection($payments);
    }

    public function storeGcashPayment(Request $request, Order $order)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reference_number' => 'required|string|max:100',
            'proof_image' => 'required|image|max:5120',
        ]);

        $customer = $this->customerUser($request)->customer;
        abort_unless($order->customer_id === $customer->id, 404);
        abort_unless($order->payment_preference === 'GCash', 422, 'This order is not set up for GCash payment.');

        if ($order->payments()->where('status', 'Pending Verification')->exists()) {
            throw ValidationException::withMessages([
                'payment' => ['A GCash payment for this order is already awaiting verification.'],
            ]);
        }

        $confirmedTotal = (float) $order->payments()->where('status', 'Confirmed')->sum('amount');
        $remaining = max(0, (float) $order->total_amount - $confirmedTotal);
        if ((float) $data['amount'] > $remaining) {
            throw ValidationException::withMessages([
                'amount' => ["The payment cannot be greater than the remaining balance of {$remaining} ."],
            ]);
        }

        $proofPath = $request->file('proof_image')->store('payment-proofs', 'local');
        try {
            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $data['amount'],
                'payment_date' => now()->toDateString(),
                'method' => 'GCash',
                'status' => 'Pending Verification',
                'reference_number' => $data['reference_number'],
                'proof_image_path' => $proofPath,
            ]);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($proofPath);
            throw $error;
        }

        ShopEmailNotifications::paymentSubmitted($payment);

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    private function customerUser(Request $request)
    {
        $user = $request->user()->load('customer');
        abort_unless($user->customer, 403, 'Customer profile is not linked to this account.');

        return $user;
    }
}
