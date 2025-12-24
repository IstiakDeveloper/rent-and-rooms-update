<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserDetailsService
{
    public function updateProofDocuments(Request $request, User $user)
    {
        $validated = $request->validate([
            'proof_type_1' => 'nullable|string',
            'proof_path_1' => 'nullable|file|max:10240',
            'proof_type_2' => 'nullable|string',
            'proof_path_2' => 'nullable|file|max:10240',
            'proof_type_3' => 'nullable|string',
            'proof_path_3' => 'nullable|file|max:10240',
            'proof_type_4' => 'nullable|string',
            'proof_path_4' => 'nullable|file|max:10240',
        ]);

        $updateData = [];

        for ($i = 1; $i <= 4; $i++) {
            if ($request->has("proof_type_{$i}")) {
                $updateData["proof_type_{$i}"] = $validated["proof_type_{$i}"];
            }

            if ($request->hasFile("proof_path_{$i}")) {
                if ($user->{"proof_path_{$i}"}) {
                    Storage::delete($user->{"proof_path_{$i}"});
                }

                $path = $request->file("proof_path_{$i}")->store('proof_documents', 'public');
                $updateData["proof_path_{$i}"] = $path;
            }
        }

        $user->update($updateData);
        return $user;
    }

    public function updateBankDetails(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_code' => 'required|string|max:20',
            'account' => 'required|string|max:30',
        ]);

        return $user->bankDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );
    }

    public function updateAgreementDetails(Request $request, User $user)
    {
        $validated = $request->validate([
            'agreement_type' => 'required|string',
            'duration' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'deposit' => 'required|numeric|min:0',
        ]);

        return $user->agreementDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );
    }

    public function updateUserDetails(Request $request, User $user)
    {
        $validated = $request->validate([
            'phone' => 'nullable|string|max:20',
            'occupied_address' => 'nullable|string',
            'package' => 'nullable|string',
            'booking_type' => 'nullable|string',
            'duration_type' => 'nullable|string',
            'payment_status' => 'required|string',
            'package_price' => 'nullable|numeric|min:0',
            'security_amount' => 'nullable|numeric|min:0',
            'entry_date' => 'nullable|date',
            'package_id' => 'nullable|exists:packages,id',
        ]);

        return $user->userDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );
    }

    public function updateUserInfo(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:15',
        ]);

        $user->update($validated);
        return $user;
    }
}
