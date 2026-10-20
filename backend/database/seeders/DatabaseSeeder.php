<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Measurement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Ava Navarro', 'password' => 'password', 'role' => 'admin', 'customer_id' => null]
        );

        $staff = collect([
            User::updateOrCreate(
                ['email' => 'staff@example.com'],
                ['name' => 'Maria Santos', 'password' => 'password', 'role' => 'staff', 'customer_id' => null]
            ),
            User::updateOrCreate(
                ['email' => 'marco@example.com'],
                ['name' => 'Marco Reyes', 'password' => 'password', 'role' => 'staff', 'customer_id' => null]
            ),
        ]);

        $serviceData = [
            'Uniform Sewing' => ['description' => 'Made-to-measure school and work uniforms.', 'base_price' => 1200],
            'Clothing Alteration' => ['description' => 'Hemming, taking in, and fit adjustments.', 'base_price' => 350],
            'Dressmaking' => ['description' => 'Custom dresses with a fitting appointment.', 'base_price' => 3800],
            'Barong Tailoring' => ['description' => 'Traditional formal wear made to measure.', 'base_price' => 4500],
            'Gown Making' => ['description' => 'Custom occasion and bridal gowns.', 'base_price' => 5200],
            'Garment Repair' => ['description' => 'Basic repairs, seams, buttons, and zippers.', 'base_price' => 200],
        ];

        $services = collect($serviceData)->mapWithKeys(fn (array $attributes, string $name) => [
            $name => Service::updateOrCreate(['name' => $name], $attributes),
        ]);

        $customerData = [
            'customer@example.com' => [
                'name' => 'Mika Dela Cruz', 'phone' => '09171234567',
                'address' => 'Project 4, Quezon City', 'garment' => 'School uniform',
                'measurements' => ['unit' => 'cm', 'chest' => 86, 'waist' => 68, 'hips' => 92, 'shoulder' => 38, 'sleeve' => 57],
            ],
            'ana.reyes@example.com' => [
                'name' => 'Ana Reyes', 'phone' => '09182345678',
                'address' => 'Mandaluyong City', 'garment' => 'Dress',
                'measurements' => ['unit' => 'cm', 'chest' => 90, 'waist' => 72, 'hips' => 98, 'shoulder' => 39, 'sleeve' => 56],
            ],
            'ramon.santos@example.com' => [
                'name' => 'Ramon Santos', 'phone' => '09203456789',
                'address' => 'Marikina City', 'garment' => 'Barong Tagalog',
                'measurements' => ['unit' => 'cm', 'chest' => 102, 'waist' => 92, 'hips' => 104, 'shoulder' => 45, 'sleeve' => 62],
            ],
            'liza.cruz@example.com' => [
                'name' => 'Liza Cruz', 'phone' => '09214567890',
                'address' => 'Pasig City', 'garment' => 'Trousers',
                'measurements' => ['unit' => 'cm', 'waist' => 74, 'hips' => 96, 'inseam' => 76, 'outseam' => 102],
            ],
            'carlo.mendoza@example.com' => [
                'name' => 'Carlo Mendoza', 'phone' => '09225678901',
                'address' => 'San Juan City', 'garment' => 'Work uniform',
                'measurements' => ['unit' => 'cm', 'chest' => 98, 'waist' => 84, 'hips' => 100, 'shoulder' => 43, 'sleeve' => 61],
            ],
            'sofia.garcia@example.com' => [
                'name' => 'Sofia Garcia', 'phone' => '09236789012',
                'address' => 'Pasay City', 'garment' => 'Evening gown',
                'measurements' => ['unit' => 'cm', 'chest' => 88, 'waist' => 70, 'hips' => 96, 'shoulder' => 37, 'sleeve' => 55],
            ],
        ];

        $customers = [];
        foreach ($customerData as $email => $details) {
            $account = User::where('email', $email)->first();
            $customer = $account?->customer;
            if (!$customer) {
                $customer = Customer::firstOrNew(['name' => $details['name']]);
            }

            $customer->fill([
                'name' => $details['name'],
                'phone' => $details['phone'],
                'address' => $details['address'],
            ])->save();

            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $details['name'],
                    'password' => 'password',
                    'role' => 'customer',
                    'customer_id' => $customer->id,
                ]
            );

            Measurement::updateOrCreate(
                ['customer_id' => $customer->id, 'garment' => $details['garment']],
                ['details' => $details['measurements']]
            );

            $customers[$email] = $customer;
        }

        $orderData = [
            [
                'customer' => 'customer@example.com', 'service' => 'Uniform Sewing',
                'garment' => 'White school blouse and skirt', 'quantity' => 2,
                'status' => 'In Progress', 'days_ago' => 5, 'due_in' => 7,
                'payment_preference' => 'Pay in person', 'notes' => 'Please check sleeve length at the next fitting.',
                'payment' => ['amount' => 800, 'method' => 'Cash', 'status' => 'Confirmed', 'reference_number' => 'DEMO-CASH-001', 'days_ago' => 2],
            ],
            [
                'customer' => 'ana.reyes@example.com', 'service' => 'Dressmaking',
                'garment' => 'Navy blue formal dress', 'quantity' => 1,
                'status' => 'Ready for Fitting', 'days_ago' => 12, 'due_in' => 3,
                'payment_preference' => 'Pay in person', 'notes' => 'First fitting requested before final hem.',
                'payment' => ['amount' => 1500, 'method' => 'Cash', 'status' => 'Confirmed', 'reference_number' => 'DEMO-CASH-002', 'days_ago' => 4],
            ],
            [
                'customer' => 'ramon.santos@example.com', 'service' => 'Barong Tailoring',
                'garment' => 'Cream piña blend barong', 'quantity' => 1,
                'status' => 'Pending', 'days_ago' => 0, 'due_in' => 14,
                'payment_preference' => 'GCash', 'notes' => 'For a family wedding; include matching inner shirt.',
                'payment' => null,
            ],
            [
                'customer' => 'liza.cruz@example.com', 'service' => 'Clothing Alteration',
                'garment' => 'Navy work trousers, hem adjustment', 'quantity' => 2,
                'status' => 'Ready for Pickup', 'days_ago' => 6, 'due_in' => 1,
                'payment_preference' => 'Pay in person', 'notes' => 'Keep original hem finish if possible.',
                'payment' => ['amount' => 700, 'method' => 'Cash', 'status' => 'Confirmed', 'reference_number' => 'DEMO-CASH-003', 'days_ago' => 0],
            ],
            [
                'customer' => 'carlo.mendoza@example.com', 'service' => 'Uniform Sewing',
                'garment' => 'Charcoal office polo and trousers', 'quantity' => 3,
                'status' => 'Completed', 'days_ago' => 35, 'due_in' => -18,
                'payment_preference' => 'Pay in person', 'notes' => 'Completed; customer collected all three sets.',
                'payment' => ['amount' => 3600, 'method' => 'Cash', 'status' => 'Confirmed', 'reference_number' => 'DEMO-CASH-004', 'days_ago' => 18],
            ],
            [
                'customer' => 'sofia.garcia@example.com', 'service' => 'Gown Making',
                'garment' => 'Dusty rose evening gown', 'quantity' => 1,
                'status' => 'In Progress', 'days_ago' => 9, 'due_in' => 12,
                'payment_preference' => 'GCash', 'notes' => 'Soft lining and a concealed back zipper.',
                'payment' => ['amount' => 1000, 'method' => 'GCash', 'status' => 'Pending Verification', 'reference_number' => 'DEMO-GCASH-001', 'days_ago' => 1],
            ],
        ];

        foreach ($orderData as $index => $details) {
            $customer = $customers[$details['customer']];
            $service = $services[$details['service']];
            $order = Order::updateOrCreate(
                ['customer_id' => $customer->id, 'notes' => $details['notes']],
                [
                    'user_id' => $staff[$index % $staff->count()]->id,
                    'order_date' => today()->subDays($details['days_ago'])->toDateString(),
                    'due_date' => today()->addDays($details['due_in'])->toDateString(),
                    'status' => $details['status'],
                    'total_amount' => (float) $service->base_price * $details['quantity'],
                    'payment_preference' => $details['payment_preference'],
                ]
            );

            OrderItem::updateOrCreate(
                ['order_id' => $order->id, 'garment' => $details['garment']],
                [
                    'service_id' => $service->id,
                    'quantity' => $details['quantity'],
                    'price' => $service->base_price,
                ]
            );

            if ($details['payment']) {
                Payment::updateOrCreate(
                    ['order_id' => $order->id, 'reference_number' => $details['payment']['reference_number']],
                    [
                        'amount' => $details['payment']['amount'],
                        'payment_date' => today()->subDays($details['payment']['days_ago'])->toDateString(),
                        'method' => $details['payment']['method'],
                        'status' => $details['payment']['status'],
                    ]
                );
            }
        }
    }
}
