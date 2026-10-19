<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'amount' => $this->amount,
            'payment_date' => $this->payment_date,
            'method' => $this->method,
            'status' => $this->status,
            'reference_number' => $this->reference_number,
            'has_proof_image' => (bool) $this->proof_image_path,
            'order_remaining_balance' => $this->order_remaining_balance,
            'created_at' => $this->created_at,
        ];
    }
}
