<?php

namespace App\Http\Controllers;

use App\Models\AgreementDetail;
use App\Models\BankDetail;
use App\Models\Package;
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
            'documents',
            'agreementDetail',
            'bankDetail',
            'partnerDocuments',
            'userDetail.package',
            'bookings.package',
            'bookings.bookingPayments',
            'bookings.payments',
            'roles'
        ]);

        $role = $user->roles->first()?->name ?? 'User';

        // Explicitly serialize the data
        $userData = $user->toArray();

        // Map camelCase relationships to snake_case for frontend
        $userData['agreement_detail'] = $user->agreementDetail ? $user->agreementDetail->toArray() : null;
        $userData['bank_detail'] = $user->bankDetail ? $user->bankDetail->toArray() : null;
        $userData['partner_documents'] = $user->partnerDocuments ? $user->partnerDocuments->toArray() : null;

        // Remove camelCase versions if they exist
        unset($userData['agreementDetail'], $userData['bankDetail'], $userData['partnerDocuments']);

        return Inertia::render('Profile/Show', [
            'user' => $userData,
            'role' => $role
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate(['name' => 'required|string|max:255', 'email' => 'required|email|max:255|unique:users,email,' . $user->id, 'phone' => 'nullable|string|max:20', 'address' => 'nullable|string|max:500']);
        $user->update($validated);
        return back()->with('success', 'Profile updated successfully');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate(['current_password' => 'required', 'password' => 'required|min:8|confirmed']);
        $user = Auth::user();
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Current password is incorrect']);
        }
        $user->update(['password' => Hash::make($request->password)]);
        return back()->with('success', 'Password updated successfully');
    }

    public function updateUserDetail(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate(['phone' => 'nullable|string|max:20', 'occupied_address' => 'nullable|string|max:500', 'package_id' => 'nullable|exists:packages,id', 'booking_type' => 'nullable|string|max:50', 'entry_date' => 'nullable|date', 'package_price' => 'nullable|numeric', 'security_amount' => 'nullable|numeric', 'stay_status' => 'nullable|string|in:staying,not_staying']);
        if (isset($validated['stay_status']) && $validated['stay_status'] === 'not_staying') {
            $validated['package_id'] = null;
        }
        $user->userDetail()->updateOrCreate(['user_id' => $user->id], $validated);
        return back()->with('success', 'User details saved successfully');
    }

    public function updateAgreementDetail(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate(['agreement_type' => 'required|string|max:100', 'duration' => 'required|string|max:50', 'amount' => 'required|numeric', 'deposit' => 'required|numeric']);
        $user->agreementDetail()->updateOrCreate(['user_id' => $user->id], $validated);
        return back()->with('success', 'Agreement details saved successfully');
    }

    public function deleteAgreementDetail()
    {
        Auth::user()->agreementDetail()->delete();
        return back()->with('success', 'Agreement details deleted successfully');
    }

    public function updateBankDetail(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate(['name' => 'required|string|max:255', 'sort_code' => 'required|string|max:20', 'account' => 'required|string|max:50']);
        $user->bankDetail()->updateOrCreate(['user_id' => $user->id], $validated);
        return back()->with('success', 'Bank details saved successfully');
    }

    public function uploadDocument(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate(['person_name' => 'required|string|max:255', 'passport' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'nid_or_other' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'payslip' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'student_card' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048']);
        $documentData = ['user_id' => $user->id, 'person_name' => $validated['person_name']];
        if ($request->hasFile('passport')) {
            $documentData['passport'] = $request->file('passport')->store('documents', 'public');
        }
        if ($request->hasFile('nid_or_other')) {
            $documentData['nid_or_other'] = $request->file('nid_or_other')->store('documents', 'public');
        }
        if ($request->hasFile('payslip')) {
            $documentData['payslip'] = $request->file('payslip')->store('documents', 'public');
        }
        if ($request->hasFile('student_card')) {
            $documentData['student_card'] = $request->file('student_card')->store('documents', 'public');
        }
        UserDocument::create($documentData);
        return back()->with('success', 'Document uploaded successfully');
    }

    public function updateDocument(Request $request, $id)
    {
        $user = Auth::user();
        $document = UserDocument::where('user_id', $user->id)->findOrFail($id);
        $validated = $request->validate(['person_name' => 'nullable|string|max:255', 'passport' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'nid_or_other' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'payslip' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'student_card' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048']);
        if (isset($validated['person_name'])) {
            $document->person_name = $validated['person_name'];
        }
        if ($request->hasFile('passport')) {
            if ($document->passport) Storage::disk('public')->delete($document->passport);
            $document->passport = $request->file('passport')->store('documents', 'public');
        }
        if ($request->hasFile('nid_or_other')) {
            if ($document->nid_or_other) Storage::disk('public')->delete($document->nid_or_other);
            $document->nid_or_other = $request->file('nid_or_other')->store('documents', 'public');
        }
        if ($request->hasFile('payslip')) {
            if ($document->payslip) Storage::disk('public')->delete($document->payslip);
            $document->payslip = $request->file('payslip')->store('documents', 'public');
        }
        if ($request->hasFile('student_card')) {
            if ($document->student_card) Storage::disk('public')->delete($document->student_card);
            $document->student_card = $request->file('student_card')->store('documents', 'public');
        }
        $document->save();
        return back()->with('success', 'Document updated successfully');
    }

    public function deleteDocument($id)
    {
        $user = Auth::user();
        $document = UserDocument::where('user_id', $user->id)->findOrFail($id);
        if ($document->passport) Storage::disk('public')->delete($document->passport);
        if ($document->nid_or_other) Storage::disk('public')->delete($document->nid_or_other);
        if ($document->payslip) Storage::disk('public')->delete($document->payslip);
        if ($document->student_card) Storage::disk('public')->delete($document->student_card);
        $document->delete();
        return back()->with('success', 'Document deleted successfully');
    }

    public function updateIdProof(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate(['proof_type_1' => 'nullable|string|max:50', 'proof_type_2' => 'nullable|string|max:50', 'proof_type_3' => 'nullable|string|max:50', 'proof_type_4' => 'nullable|string|max:50', 'proof_path_1' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'proof_path_2' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'proof_path_3' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048', 'proof_path_4' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048']);
        if ($request->hasFile('proof_path_1')) {
            if ($user->proof_path_1) Storage::disk('public')->delete($user->proof_path_1);
            $user->proof_path_1 = $request->file('proof_path_1')->store('documents', 'public');
        }
        if ($request->hasFile('proof_path_2')) {
            if ($user->proof_path_2) Storage::disk('public')->delete($user->proof_path_2);
            $user->proof_path_2 = $request->file('proof_path_2')->store('documents', 'public');
        }
        if ($request->hasFile('proof_path_3')) {
            if ($user->proof_path_3) Storage::disk('public')->delete($user->proof_path_3);
            $user->proof_path_3 = $request->file('proof_path_3')->store('documents', 'public');
        }
        if ($request->hasFile('proof_path_4')) {
            if ($user->proof_path_4) Storage::disk('public')->delete($user->proof_path_4);
            $user->proof_path_4 = $request->file('proof_path_4')->store('documents', 'public');
        }
        $user->proof_type_1 = $request->proof_type_1;
        $user->proof_type_2 = $request->proof_type_2;
        $user->proof_type_3 = $request->proof_type_3;
        $user->proof_type_4 = $request->proof_type_4;
        $user->save();
        return back()->with('success', 'ID proof updated successfully');
    }

    /**
     * Download user document
     */
    public function downloadDocument(UserDocument $document, string $field)
    {
        // Check if document belongs to current user
        if ($document->user_id !== Auth::id()) {
            abort(403);
        }

        $validFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        if (!in_array($field, $validFields)) {
            abort(400, 'Invalid document field.');
        }

        $filePath = $document->$field;

        if (!$filePath) {
            abort(404, 'Document not found.');
        }

        // Check if file exists in public disk
        if (!Storage::disk('public')->exists($filePath)) {
            abort(404, 'Document file not found in storage.');
        }

        $fileName = basename($filePath);
        $friendlyName = str_replace('_', ' ', ucfirst($field)) . '_' . $document->person_name . '_' . $fileName;

        return Storage::disk('public')->download($filePath, $friendlyName);
    }
}
