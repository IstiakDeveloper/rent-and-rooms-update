<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles if they don't exist
        Role::firstOrCreate(['name' => 'User']);
        Role::firstOrCreate(['name' => 'Partner']);
        Role::firstOrCreate(['name' => 'Admin']);

        $this->command->info('Roles created successfully!');
    }
}
