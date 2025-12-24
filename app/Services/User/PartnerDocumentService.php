<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\PartnerDocumentItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PartnerDocumentService
{
    /**
     * Get all partner documents for a user
     */
    public function getPartnerDocuments(User $user)
    {
        return PartnerDocumentItem::where('user_id', $user->id)
            ->where('document_type', 'partner')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all package documents for a user
     */
    public function getPackageDocuments(User $user)
    {
        return PartnerDocumentItem::where('user_id', $user->id)
            ->where('document_type', 'package')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Add a new document
     */
    public function addDocument(Request $request, User $user)
    {
        $validated = $request->validate([
            'document_type' => 'required|in:partner,package',
            'document_name' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $filePath = $request->file('file')->store('partner_documents', 'public');

            $document = PartnerDocumentItem::create([
                'user_id' => $user->id,
                'document_type' => $validated['document_type'],
                'document_name' => $validated['document_name'],
                'file_path' => $filePath,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'active',
            ]);

            Log::info('Partner document added', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'document_type' => $validated['document_type'],
                'document_name' => $validated['document_name'],
            ]);

            return $document;
        } catch (\Exception $e) {
            Log::error('Error adding partner document', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing document
     */
    public function updateDocument(Request $request, User $user, PartnerDocumentItem $document)
    {
        // Verify document belongs to user
        if ($document->user_id !== $user->id) {
            throw new \Exception('Unauthorized access to document');
        }

        $validated = $request->validate([
            'document_name' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'status' => 'nullable|in:active,expired,pending',
        ]);

        try {
            $updateData = [
                'document_name' => $validated['document_name'],
                'expiry_date' => $validated['expiry_date'] ?? $document->expiry_date,
                'notes' => $validated['notes'] ?? $document->notes,
                'status' => $validated['status'] ?? $document->status,
            ];

            // Handle file upload if new file provided
            if ($request->hasFile('file')) {
                // Delete old file
                if ($document->file_path) {
                    Storage::disk('public')->delete($document->file_path);
                }

                $filePath = $request->file('file')->store('partner_documents', 'public');
                $updateData['file_path'] = $filePath;
            }

            $document->update($updateData);

            Log::info('Partner document updated', [
                'user_id' => $user->id,
                'document_id' => $document->id,
            ]);

            return $document;
        } catch (\Exception $e) {
            Log::error('Error updating partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Delete a document
     */
    public function deleteDocument(User $user, PartnerDocumentItem $document)
    {
        // Verify document belongs to user
        if ($document->user_id !== $user->id) {
            throw new \Exception('Unauthorized access to document');
        }

        try {
            // Delete file from storage
            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            Log::info('Partner document deleted', [
                'user_id' => $user->id,
                'document_id' => $document->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Download a document
     */
    public function downloadDocument(User $user, PartnerDocumentItem $document)
    {
        // Verify document belongs to user
        if ($document->user_id !== $user->id) {
            throw new \Exception('Unauthorized access to document');
        }

        if (!$document->file_path) {
            throw new \Exception('Document file not found');
        }

        if (!Storage::disk('public')->exists($document->file_path)) {
            Log::error('Partner document file not found in storage', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'path' => $document->file_path,
            ]);
            throw new \Exception('Document file not found in storage');
        }

        $fileName = $document->document_name . '_' . $user->name . '_' . basename($document->file_path);

        return Storage::disk('public')->download($document->file_path, $fileName);
    }

    /**
     * Get document statistics for a user
     */
    public function getDocumentStats(User $user)
    {
        $partnerDocs = $this->getPartnerDocuments($user);
        $packageDocs = $this->getPackageDocuments($user);

        return [
            'total_partner_documents' => $partnerDocs->count(),
            'total_package_documents' => $packageDocs->count(),
            'expired_documents' => $partnerDocs->concat($packageDocs)->filter(fn($doc) => $doc->isExpired())->count(),
            'expiring_soon' => $partnerDocs->concat($packageDocs)->filter(fn($doc) => $doc->isExpiringSoon())->count(),
        ];
    }
}
