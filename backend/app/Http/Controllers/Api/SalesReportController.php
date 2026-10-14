<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class SalesReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'from' => 'sometimes|required|date',
            'to' => 'sometimes|required|date',
        ]);

        if (isset($data['from'], $data['to']) && Carbon::parse($data['to'])->lt($data['from'])) {
            throw ValidationException::withMessages([
                'to' => ['The end date must be on or after the start date.'],
            ]);
        }

        $from = $data['from'] ?? now()->startOfMonth()->toDateString();
        $to = $data['to'] ?? now()->toDateString();
        $payments = Payment::query()->whereBetween('payment_date', [$from, $to]);

        return response()->json([
            'from' => $from,
            'to' => $to,
            'payments_received' => (float) (clone $payments)->sum('amount'),
            'payment_count' => (clone $payments)->count(),
            'daily_sales' => (clone $payments)
                ->selectRaw('payment_date, SUM(amount) as total')
                ->groupBy('payment_date')
                ->orderBy('payment_date')
                ->get(),
        ]);
    }
}
