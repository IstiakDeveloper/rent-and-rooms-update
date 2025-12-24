<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JoinPackagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert header content
        DB::table('join_with_us_header')->insert([
            'main_title' => 'Rent & Rooms Packages',
            'subtitle' => 'Please join with us to fits your needs whether you\'re a landlord looking for support to maintain your, an investor seeking full management, or a partner ready to grow with us. Our packages are designed to offer flexibility, transparency, and exceptional value.',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Package 1: Flexible Package
        DB::table('join_packages')->insert([
            'title' => 'Flexible Package',
            'subtitle' => 'Perfect for independent landlords who want control with optional support.',
            'description' => 'Perfect for independent landlords who want control with optional support.',
            'whats_included' => json_encode([
                'Online property listing on Rent&Rooms platform',
                'Digital tenancy creation & e-signing',
                'Rent collection tools',
                'Optional add-on services (certifications, inspections, maintenance)',
                'Pay-as-you-go maintenance with no long-term commitment',
                'Access to landlord dashboard and compliance reminders'
            ]),
            'ideal_for' => 'Landlords who want flexibility, minimal fees, and full control while accessing services only when needed.',
            'price' => 'Per month: £40 or Per year £400',
            'price_note' => '*',
            'display_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Package 2: Easy Partner Package
        DB::table('join_packages')->insert([
            'title' => 'Easy Partner Package',
            'subtitle' => 'A simple, low-commitment way to work with Rent&Rooms.',
            'description' => 'The Easy Partner Package is designed for landlords, small operators, or individuals who want support from Rent&Rooms without long-term obligations. It\'s flexible, affordable, and perfect for those who want to grow with us at their own pace.',
            'whats_included' => json_encode([
                'Property listing on the Rent&Rooms platform',
                'Tenant sourcing & referencing',
                'Compliance reminders & support',
                'Maintenance coordination with our in-house team',
                'Access to digital dashboards & management tools',
                'Optional add-on services (certs, inspections, cleaning, staging)'
            ]),
            'ideal_for' => 'Landlords who want help managing their property but still want control—and want a simple, entry-level partnership.',
            'price' => null,
            'price_note' => null,
            'display_order' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Package 3: Franchise Partner Package
        DB::table('join_packages')->insert([
            'title' => 'Franchise Partner Package',
            'subtitle' => 'A complete business opportunity powered by the Rent&Rooms brand.',
            'description' => 'The Franchise Partner Package is a full business model for entrepreneurs who want to operate their own Rent&Rooms branch. This package includes training, technology, branding, support systems, and everything needed to run a professional property management business locally.',
            'whats_included' => json_encode([
                'Full Rent&Rooms brand license & regional territory',
                'Access to our digital platform, CRM & automation tools',
                'Comprehensive training & onboarding',
                'Marketing materials & brand guidelines',
                'Operational manuals, compliance systems & SOPs',
                'Dedicated support team for growth, management & scaling',
                'Ability to manage HMOs, serviced accommodation, holiday homes & full lettings',
                'Exclusive partner benefits & revenue models'
            ]),
            'ideal_for' => 'Entrepreneurs, investors, or operators who want to run a full Rent&Rooms franchise and grow a sustainable business in their region.',
            'price' => null,
            'price_note' => null,
            'display_order' => 3,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Package 4: Premium Package
        DB::table('join_packages')->insert([
            'title' => 'Premium Package',
            'subtitle' => 'A complete, hands-off solution for landlords, investors, and HMO/SA operators.',
            'description' => 'A complete, hands-off solution for landlords, investors, and HMO/SA operators.',
            'whats_included' => json_encode([
                'All benefits of the Partner Package',
                'Full property management & occupancy handling',
                'Guaranteed compliance coverage',
                '24/7 maintenance support',
                'Monthly performance reporting',
                'Dynamic pricing for higher profits',
                'Full furnishing & staging guidance (optional)',
                'Priority customer support',
                'Holiday homes & serviced accommodation management (if applicable)'
            ]),
            'ideal_for' => 'Busy landlords and investors seeking maximum return with zero hassle—Rent&Rooms handles everything.',
            'price' => null,
            'price_note' => null,
            'display_order' => 4,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
