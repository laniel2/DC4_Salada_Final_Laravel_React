<?php

namespace App\Support;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\ShopEventNotification;
use Illuminate\Support\Facades\Log;

class ShopEmailNotifications
{
    public static function orderRequested(Order $order): void
    {
        $order->loadMissing(['customer', 'user', 'items.service']);
        $garments = $order->items->map(fn ($item) => $item->garment)->filter()->implode(', ');
        $lines = [
            "A new order request (#{$order->id}) was submitted.",
            'Customer: ' . ($order->customer?->name ?? 'Customer'),
            'Requested work: ' . ($garments ?: 'Tailoring order'),
            'Due date: ' . $order->due_date,
        ];

        self::notifyShop(
            'New tailoring order request #' . $order->id,
            'New order request',
            $lines,
            '/manage',
            'View orders',
        );
        self::notifyAssignedStaff($order, 'New order assigned to you', 'A new tailoring order has been assigned to you.', '/');

        self::notifyCustomer(
            $order,
            'We received order request #' . $order->id,
            'Order request received',
            ['Your order request has been sent to the shop.', 'Requested due date: ' . $order->due_date],
            '/orders',
            'View your orders',
        );
    }

    public static function orderStatusChanged(Order $order, string $status): void
    {
        self::notifyCustomer(
            $order,
            'Order #' . $order->id . ' status updated',
            'Your order status changed',
            ['The status of your order is now: ' . $status, 'Due date: ' . $order->due_date],
            '/orders',
            'View your orders',
        );
    }

    public static function paymentSubmitted(Payment $payment): void
    {
        $payment->loadMissing('order.customer');
        $order = $payment->order;
        if (!$order) return;

        self::notifyShop(
            'GCash payment awaiting verification for order #' . $order->id,
            'GCash payment needs review',
            [
                'A customer submitted a GCash payment for order #' . $order->id . '.',
                'Customer: ' . ($order->customer?->name ?? 'Customer'),
                'Amount: ₱' . number_format((float) $payment->amount, 2),
                'Reference number: ' . ($payment->reference_number ?: 'Not provided'),
            ],
            '/manage',
            'Review payment',
        );
        self::notifyAssignedStaff($order, 'GCash payment submitted', 'A customer submitted a GCash receipt for order #' . $order->id . '.', '/');
    }

    public static function paymentStatusChanged(Payment $payment, string $status): void
    {
        $payment->loadMissing('order');
        $order = $payment->order;
        if (!$order) return;

        $message = $status === 'Confirmed'
            ? 'Your GCash payment has been confirmed.'
            : 'Your GCash payment was not approved. Please contact the shop if you need help.';

        self::notifyCustomer(
            $order,
            'Payment update for order #' . $order->id,
            'Your payment was reviewed',
            [$message, 'Payment amount: ₱' . number_format((float) $payment->amount, 2)],
            '/orders',
            'View your orders',
        );
    }

    private static function notifyShop(string $subject, string $greeting, array $lines, string $path, string $label): void
    {
        User::query()->where('role', 'admin')->each(
            fn (User $admin) => self::send($admin, $subject, $greeting, $lines, $path, $label)
        );
    }

    private static function notifyCustomer(Order $order, string $subject, string $greeting, array $lines, string $path, string $label): void
    {
        $customer = User::query()->where('customer_id', $order->customer_id)->first();
        if ($customer) self::send($customer, $subject, $greeting, $lines, $path, $label);
    }

    private static function notifyAssignedStaff(Order $order, string $subject, string $message, string $path): void
    {
        $staff = $order->user;
        if ($staff && $staff->role === 'staff') {
            self::send($staff, $subject, $subject, [$message], $path, 'View assigned jobs');
        }
    }

    private static function send(User $recipient, string $subject, string $greeting, array $lines, string $path, string $label): void
    {
        try {
            $recipient->notify(new ShopEventNotification($subject, $greeting, $lines, $path, $label));
        } catch (\Throwable $error) {
            Log::warning('Could not send tailoring email notification.', [
                'recipient_id' => $recipient->id,
                'subject' => $subject,
                'error' => $error->getMessage(),
            ]);
        }
    }
}
