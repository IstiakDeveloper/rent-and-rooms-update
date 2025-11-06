<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            // User Management
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',
            'manage-user-documents',
            'manage-user-payments',

            // Package Management
            'view-packages',
            'create-packages',
            'edit-packages',
            'delete-packages',
            'assign-packages',

            // Booking Management
            'view-bookings',
            'create-bookings',
            'edit-bookings',
            'delete-bookings',
            'manage-booking-payments',
            'extend-bookings',
            'cancel-bookings',

            // Payment Management
            'view-payments',
            'update-payment-status',
            'generate-payment-links',
            'revoke-payment-links',

            // Property Management
            'view-properties',
            'create-properties',
            'edit-properties',
            'delete-properties',

            // Location Management
            'manage-countries',
            'manage-cities',
            'manage-areas',

            // Amenity & Maintenance Management
            'manage-amenities',
            'manage-amenity-types',
            'manage-maintains',
            'manage-maintain-types',

            // Mail Management
            'view-mail',
            'send-mail',
            'send-bulk-notification',

            // Settings Management
            'view-settings',
            'edit-header-settings',
            'edit-footer-settings',
            'edit-hero-settings',
            'edit-home-data-settings',
            'edit-policy-settings',
            'manage-social-links',

            // Profile Management
            'view-own-profile',
            'edit-own-profile',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create Roles and Assign Permissions

        // Super Admin - All Permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - Most Permissions except Settings
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $adminPermissions = [
            'view-users', 'create-users', 'edit-users', 'delete-users',
            'manage-user-documents', 'manage-user-payments',
            'view-packages', 'create-packages', 'edit-packages', 'delete-packages', 'assign-packages',
            'view-bookings', 'create-bookings', 'edit-bookings', 'delete-bookings',
            'manage-booking-payments', 'extend-bookings', 'cancel-bookings',
            'view-payments', 'update-payment-status', 'generate-payment-links', 'revoke-payment-links',
            'view-properties', 'create-properties', 'edit-properties', 'delete-properties',
            'manage-countries', 'manage-cities', 'manage-areas',
            'manage-amenities', 'manage-amenity-types', 'manage-maintains', 'manage-maintain-types',
            'view-mail', 'send-mail', 'send-bulk-notification',
            'view-own-profile', 'edit-own-profile',
        ];
        $admin->syncPermissions($adminPermissions);

        // Partner - Limited Permissions (own packages/bookings only)
        $partner = Role::firstOrCreate(['name' => 'Partner', 'guard_name' => 'web']);
        $partnerPermissions = [
            'view-packages', 'edit-packages',
            'view-bookings', 'view-payments',
            'view-own-profile', 'edit-own-profile',
            'manage-user-documents',
        ];
        $partner->syncPermissions($partnerPermissions);

        // Customer - Minimal Permissions
        $customer = Role::firstOrCreate(['name' => 'Customer', 'guard_name' => 'web']);
        $customerPermissions = [
            'view-own-profile', 'edit-own-profile',
        ];
        $customer->syncPermissions($customerPermissions);

        // User - Default Role
        $user = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);
        $userPermissions = [
            'view-own-profile', 'edit-own-profile',
        ];
        $user->syncPermissions($userPermissions);

        $this->command->info('Roles and Permissions created successfully!');
    }
}
