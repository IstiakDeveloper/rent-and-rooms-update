<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AgreementDetail;
use App\Models\BankDetail;
use App\Models\Package;
use App\Models\PartnerDocument;
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
            'partnerDocuments',
            'partnerDocumentItems',
            'bookings' => function($query) {
                $query->with(['package', 'bookingPayments']);
            },
            'packages'
        ]);

        // Get user's packages for partner (matching UserController logic)
        $userPackages = Package::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            })
            ->get()
            ->map(function($package) {
                return [
                    'id' => $package->id,
                    'name' => $package->name,
                    'address' => $package->address,
                    'status' => $package->status,
                ];
            })
            ->toArray();

        $availablePackages = Package::all();

        // Get user role
        $role = $user->roles->first()?->name ?? $user->role ?? 'User';

        // Explicitly serialize the data
        $userData = $user->toArray();

        // Map camelCase relationships to snake_case for frontend
        $userData['agreement_detail'] = $user->agreementDetail ? $user->agreementDetail->toArray() : null;
        $userData['bank_detail'] = $user->bankDetail ? $user->bankDetail->toArray() : null;
        $userData['partner_documents'] = $user->partnerDocuments ? $user->partnerDocuments->toArray() : null;
        $userData['partner_document_items'] = $user->partnerDocumentItems ? $user->partnerDocumentItems->toArray() : [];

        // Remove camelCase versions if they exist
        unset($userData['agreementDetail'], $userData['bankDetail'], $userData['partnerDocuments'], $userData['partnerDocumentItems']);

        return Inertia::render('Profile/Show', [
            'user' => $userData,
            'role' => $role,
            'availablePackages' => $availablePackages,
            'userPackages' => $userPackages,
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

    public function updateBankDetail(Request $request)
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

        return redirect()->back();
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

        return redirect()->back();
    }

    // Alias for route compatibility
    public function updateAgreementDetail(Request $request)
    {
        return $this->updateAgreementDetails($request);
    }

    public function deleteAgreementDetail()
    {
        $user = Auth::user();

        if ($user->agreementDetail) {
            $user->agreementDetail->delete();
            return redirect()->back();
        }

        return redirect()->back();
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

    /**
     * Upload document - alias for storeDocument for backwards compatibility
     */
    public function uploadDocument(Request $request)
    {
        return $this->storeDocument($request);
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

    /**
     * Delete document - alias for destroyDocument for backwards compatibility
     */
    public function deleteDocument($id)
    {
        $user = Auth::user();
        $document = UserDocument::where('user_id', $user->id)->findOrFail($id);

        return $this->destroyDocument($document);
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




    // Fixed Partner Personal Documents Update
    public function updatePartnerDocuments(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'photo_id' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'photo_id_expiry' => 'nullable|date',
                'authorised_letter' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'authorised_letter_expiry' => 'nullable|date',
                'management_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'management_agreement_expiry' => 'nullable|date',
                'management_maintain_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'management_maintain_agreement_expiry' => 'nullable|date',
                'franchise_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'franchise_agreement_expiry' => 'nullable|date',
                'investor_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'investor_agreement_expiry' => 'nullable|date',
            ]);

            $partnerDoc = $user->partnerDocuments ?? new PartnerDocument(['user_id' => $user->id]);

            $updateData = [];

            $fileFields = [
                'photo_id',
                'authorised_letter',
                'management_agreement',
                'management_maintain_agreement',
                'franchise_agreement',
                'investor_agreement',
            ];

            foreach ($fileFields as $field) {
                if ($request->hasFile($field)) {
                    if ($partnerDoc->exists && $partnerDoc->$field) {
                        Storage::disk('public')->delete($partnerDoc->$field);
                    }

                    $path = $request->file($field)->store('partner_documents', 'public');
                    $updateData[$field] = $path;
                }

                $expiryField = $field . '_expiry';
                if ($request->has($expiryField)) {
                    $updateData[$expiryField] = $validated[$expiryField];
                }
            }

            if ($partnerDoc->exists) {
                $partnerDoc->update($updateData);
            } else {
                $partnerDoc->fill($updateData);
                $partnerDoc->save();
            }

            return redirect()->back()->with('success', 'Partner documents updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update documents: ' . $e->getMessage()]);
        }
    }

    // Dynamic Package Documents Management
    public function addPackageDocument(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'document_name' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $filePath = $request->file('file')->store('partner_documents', 'public');

            \App\Models\PartnerDocumentItem::create([
                'user_id' => $user->id,
                'package_id' => $validated['package_id'],
                'document_type' => 'package',
                'document_name' => $validated['document_name'],
                'file_path' => $filePath,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'active',
            ]);

            return redirect()->back()->with('success', 'Document added successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to add document: ' . $e->getMessage());
        }
    }

    public function updatePackageDocument(Request $request, $documentId)
    {
        $user = Auth::user();
        $document = \App\Models\PartnerDocumentItem::where('user_id', $user->id)->findOrFail($documentId);

        $validated = $request->validate([
            'document_name' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $updateData = [
                'document_name' => $validated['document_name'],
                'expiry_date' => $validated['expiry_date'] ?? $document->expiry_date,
                'notes' => $validated['notes'] ?? $document->notes,
            ];

            if ($request->hasFile('file')) {
                if ($document->file_path) {
                    Storage::disk('public')->delete($document->file_path);
                }
                $filePath = $request->file('file')->store('partner_documents', 'public');
                $updateData['file_path'] = $filePath;
            }

            $document->update($updateData);

            return redirect()->back()->with('success', 'Document updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update document: ' . $e->getMessage());
        }
    }

    public function deletePackageDocument($documentId)
    {
        $user = Auth::user();
        $document = \App\Models\PartnerDocumentItem::where('user_id', $user->id)->findOrFail($documentId);

        try {
            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }
            $document->delete();

            return redirect()->back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete document: ' . $e->getMessage());
        }
    }

    public function downloadPackageDocument($documentId)
    {
        $user = Auth::user();
        $document = \App\Models\PartnerDocumentItem::where('user_id', $user->id)->findOrFail($documentId);

        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'Document file not found.');
        }

        $fileName = basename($document->file_path);
        $friendlyName = $document->document_name . '_' . $fileName;

        return Storage::disk('public')->download($document->file_path, $friendlyName);
    }

    public function deletePartnerDocument(Request $request, string $type)
    {
        $user = Auth::user();
        $partnerDoc = $user->partnerDocuments;

        if (!$partnerDoc) {
            return redirect()->back()->withErrors(['error' => 'No documents found.']);
        }

        $validTypes = [
            'photo_id',
            'authorised_letter',
            'management_agreement',
            'management_maintain_agreement',
            'franchise_agreement',
            'investor_agreement',
        ];

        if (!in_array($type, $validTypes)) {
            return redirect()->back()->withErrors(['error' => 'Invalid document type.']);
        }

        if ($partnerDoc->$type) {
            Storage::disk('public')->delete($partnerDoc->$type);
        }

        $partnerDoc->update([
            $type => null,
            $type . '_expiry' => null,
        ]);

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }

    /**
     * Download partner document
     */
    public function downloadPartnerDocument(string $type)
    {
        $user = Auth::user();
        $partnerDoc = $user->partnerDocuments;

        if (!$partnerDoc) {
            abort(404, 'No documents found.');
        }

        $validTypes = [
            'photo_id',
            'authorised_letter',
            'management_agreement',
            'management_maintain_agreement',
            'franchise_agreement',
            'investor_agreement',
        ];

        if (!in_array($type, $validTypes)) {
            abort(400, 'Invalid document type.');
        }

        $filePath = $partnerDoc->$type;

        if (!$filePath) {
            abort(404, 'Document not found.');
        }

        if (!Storage::disk('public')->exists($filePath)) {
            abort(404, 'Document file not found in storage.');
        }

        $fileName = basename($filePath);
        $friendlyName = str_replace('_', ' ', ucfirst($type)) . '_' . $user->name . '_' . $fileName;

        return Storage::disk('public')->download($filePath, $friendlyName);
    }
}
