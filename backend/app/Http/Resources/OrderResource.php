<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'user_id' => $this->user_id,
            'order_date' => $this->order_date,
            'due_date' => $this->due_date,
            'status' => $this->status,
            'total_amount' => $this->total_amount,
            'notes' => $this->notes,
            'payment_preference' => $this->payment_preference,
            'has_reference_image' => (bool) $this->reference_image_path,
            'payments_total' => $this->payments_total,
            'remaining_balance' => $this->remaining_balance,
            'customer' => $this->whenLoaded('customer', fn () => $this->customer?->only([
                'id', 'name', 'phone', 'address',
            ])),
            'user' => $this->whenLoaded('user', fn () => $this->user?->only([
                'id', 'name', 'email', 'role',
            ])),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'order_id' => $payment->order_id,
                'amount' => $payment->amount,
                'payment_date' => $payment->payment_date,
                'method' => $payment->method,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
