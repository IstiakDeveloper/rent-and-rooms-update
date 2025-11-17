<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DocumentController extends Controller
{
    /**
     * Display user's documents
     */
    public function index()
    {
        $user = Auth::user();
        $user->load('documents');

        $documents = $user->documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'person_name' => $doc->person_name,
                'passport' => $doc->passport,
                'nid_or_other' => $doc->nid_or_other,
                'payslip' => $doc->payslip,
                'student_card' => $doc->student_card,
                'created_at' => $doc->created_at->format('d M, Y'),
                'updated_at' => $doc->updated_at->format('d M, Y'),
            ];
        });

        return Inertia::render('Guest/Documents/Index', [
            'documents' => $documents,
        ]);
    }
}
