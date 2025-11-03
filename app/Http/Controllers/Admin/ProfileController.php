<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AgreementDetail;
use App\Models\BankDetail;
use App\Models\Package;
use App\Models\User;
use App\Models\UserDetail;
use App\Models\UserDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();

        $user->load([
            'userDetail',
            'bankDetail',
            'agreementDetail',
            'documents',
            'bookings' => function($query) {
                $query->with(['package', 'bookingPayments']);
            },
            'packages'
        ]);

        $availablePackages = Package::all();

        return Inertia::render('Admin/Profile/Show', [
            'user' => $user,
            'availablePackages' => $availablePackages,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return redirect()->back()->withErrors(['current_password' => 'Current password is incorrect.']);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', 'Password updated successfully.');
    }

    public function updateProofDocuments(Request $request)
    {
        $user = Auth::user();

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
                // Delete old file if exists
                if ($user->{"proof_path_{$i}"}) {
                    Storage::delete($user->{"proof_path_{$i}"});
                }

                $path = $request->file("proof_path_{$i}")->store('proof_documents', 'public');
                $updateData["proof_path_{$i}"] = $path;
            }
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'Proof documents updated successfully.');
    }

    public function updateBankDetails(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_code' => 'required|string|max:20',
            'account' => 'required|string|max:30',
        ]);

        $user->bankDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return redirect()->back()->with('success', 'Bank details updated successfully.');
    }

    public function updateAgreementDetails(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'agreement_type' => 'required|string',
            'duration' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'deposit' => 'required|numeric|min:0',
        ]);

        $user->agreementDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return redirect()->back()->with('success', 'Agreement details updated successfully.');
    }

    public function updateUserDetails(Request $request)
    {
        $user = Auth::user();

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
            'stay_status' => 'required|string',
            'package_id' => 'nullable|exists:packages,id',
        ]);

        $user->userDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return redirect()->back()->with('success', 'User details updated successfully.');
    }

    public function storeDocument(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'person_name' => 'required|string|max:255',
            'passport' => 'nullable|file|max:10240',
            'nid_or_other' => 'nullable|file|max:10240',
            'payslip' => 'nullable|file|max:10240',
            'student_card' => 'nullable|file|max:10240',
        ]);

        $documentData = [
            'user_id' => $user->id,
            'person_name' => $validated['person_name'],
        ];

        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->store('user_documents', 'public');
                $documentData[$field] = $path;
            }
        }

        UserDocument::create($documentData);

        return redirect()->back()->with('success', 'Document added successfully.');
    }

    public function updateDocument(Request $request, UserDocument $document)
    {
        // Check if document belongs to current user
        if ($document->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'person_name' => 'required|string|max:255',
            'passport' => 'nullable|file|max:10240',
            'nid_or_other' => 'nullable|file|max:10240',
            'payslip' => 'nullable|file|max:10240',
            'student_card' => 'nullable|file|max:10240',
        ]);

        $updateData = [
            'person_name' => $validated['person_name'],
        ];

        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Delete old file if exists
                if ($document->$field) {
                    Storage::delete($document->$field);
                }

                $path = $request->file($field)->store('user_documents', 'public');
                $updateData[$field] = $path;
            }
        }

        $document->update($updateData);

        return redirect()->back()->with('success', 'Document updated successfully.');
    }

    public function destroyDocument(UserDocument $document)
    {
        // Check if document belongs to current user
        if ($document->user_id !== Auth::id()) {
            abort(403);
        }

        // Delete associated files
        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($document->$field) {
                Storage::delete($document->$field);
            }
        }

        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }
}
