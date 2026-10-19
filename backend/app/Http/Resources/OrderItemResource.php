<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'service_id' => $this->service_id,
            'garment' => $this->garment,
            'quantity' => $this->quantity,
            'price' => $this->price,
            'service' => $this->whenLoaded('service', fn () => $this->service?->only([
                'id', 'name', 'description', 'base_price',
            ])),
        ];
    }
}
