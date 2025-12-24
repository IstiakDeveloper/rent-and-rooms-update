<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\UserDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserDocumentService
{
    public function storeDocument(Request $request, User $user)
    {
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

        return UserDocument::create($documentData);
    }

    public function updateDocument(Request $request, User $user, UserDocument $document)
    {
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
                if ($document->$field) {
                    Storage::delete($document->$field);
                }

                $path = $request->file($field)->store('user_documents', 'public');
                $updateData[$field] = $path;
            }
        }

        $document->update($updateData);
        return $document;
    }

    public function destroyDocument(UserDocument $document)
    {
        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($document->$field) {
                Storage::delete($document->$field);
            }
        }

        $document->delete();
    }
}
