<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function index()
    {
        return response()->json(
            OrderItem::query()
                ->with(['order', 'service'])
                ->latest()
                ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'service_id' => 'required|exists:services,id',
            'garment' => 'required|string|max:255',
            'quantity' => 'sometimes|required|integer|min:1',
            'price' => 'required|numeric|min:0',
        ]);

        $item = OrderItem::create($data)->load(['order', 'service']);

        return response()->json($item, 201);
    }

    public function show(OrderItem $orderItem)
    {
        return response()->json($orderItem->load(['order', 'service']));
    }

    public function update(Request $request, OrderItem $orderItem)
    {
        $data = $request->validate([
            'order_id' => 'sometimes|required|exists:orders,id',
            'service_id' => 'sometimes|required|exists:services,id',
            'garment' => 'sometimes|required|string|max:255',
            'quantity' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
        ]);

        $orderItem->update($data);

        return response()->json($orderItem->fresh()->load(['order', 'service']));
    }

    public function destroy(OrderItem $orderItem)
    {
        $orderItem->delete();

        return response()->noContent();
    }
}
