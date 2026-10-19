<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function index()
    {
        return PaymentResource::collection(Payment::query()->with('order')->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method' => 'required|string|max:50',
            'status' => 'sometimes|required|in:Pending Verification,Confirmed,Rejected',
            'reference_number' => 'nullable|string|max:100',
        ]);
        $payment = Payment::create($data + ['status' => 'Confirmed']);

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    public function show(Payment $payment)
    {
        return new PaymentResource($payment);
    }

    public function proof(Payment $payment)
    {
        abort_unless($payment->proof_image_path && Storage::disk('local')->exists($payment->proof_image_path), 404);

        return Storage::disk('local')->response($payment->proof_image_path);
    }

    public function update(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'order_id' => 'sometimes|required|exists:orders,id',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'payment_date' => 'sometimes|required|date',
            'method' => 'sometimes|required|string|max:50',
            'status' => 'sometimes|required|in:Pending Verification,Confirmed,Rejected',
            'reference_number' => 'sometimes|nullable|string|max:100',
        ]);
        $payment->update($data);

        return new PaymentResource($payment->fresh());
    }

    public function destroy(Payment $payment)
    {
        if ($payment->proof_image_path) Storage::disk('local')->delete($payment->proof_image_path);
        $payment->delete();

        return response()->noContent();
    }
}
