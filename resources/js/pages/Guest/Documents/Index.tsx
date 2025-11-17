import { Head } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import { FileText, Eye, Download, Calendar, User } from 'lucide-react';

interface Document {
    id: number;
    person_name: string;
    passport?: string;
    nid_or_other?: string;
    payslip?: string;
    student_card?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    documents: Document[];
}

export default function Index({ documents }: Props) {
    const getDocumentCount = (doc: Document) => {
        let count = 0;
        if (doc.passport) count++;
        if (doc.nid_or_other) count++;
        if (doc.payslip) count++;
        if (doc.student_card) count++;
        return count;
    };

    return (
        <GuestDashboardLayout>
            <Head title="My Documents" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        My Documents
                    </h1>
                    <p className="mt-2 text-gray-600">
                        View all your uploaded documents
                    </p>
                </div>

                {/* Documents Grid */}
                {documents.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No documents uploaded
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Upload your documents from the Profile page
                        </p>
                        <a
                            href="/guest/profile"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Profile
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                            >
                                {/* Document Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        <h3 className="font-semibold text-gray-900">
                                            {doc.person_name}
                                        </h3>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {getDocumentCount(doc)} files
                                    </span>
                                </div>

                                {/* Document Files */}
                                <div className="space-y-2 mb-4">
                                    {/* Passport */}
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm text-gray-700">
                                            Passport
                                        </span>
                                        {doc.passport ? (
                                            <a
                                                href={`/storage/${doc.passport}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                Not uploaded
                                            </span>
                                        )}
                                    </div>

                                    {/* NID/Other */}
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm text-gray-700">
                                            NID/Other
                                        </span>
                                        {doc.nid_or_other ? (
                                            <a
                                                href={`/storage/${doc.nid_or_other}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                Not uploaded
                                            </span>
                                        )}
                                    </div>

                                    {/* Payslip */}
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm text-gray-700">
                                            Payslip
                                        </span>
                                        {doc.payslip ? (
                                            <a
                                                href={`/storage/${doc.payslip}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                Not uploaded
                                            </span>
                                        )}
                                    </div>

                                    {/* Student Card */}
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm text-gray-700">
                                            Student/Employee Card
                                        </span>
                                        {doc.student_card ? (
                                            <a
                                                href={`/storage/${doc.student_card}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                Not uploaded
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Document Footer */}
                                <div className="border-t pt-3 flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Uploaded: {doc.created_at}</span>
                                    </div>
                                    {doc.updated_at !== doc.created_at && (
                                        <span>Updated: {doc.updated_at}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                {documents.length > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900 mb-1">
                                    Need to upload more documents?
                                </h4>
                                <p className="text-sm text-blue-700">
                                    You can upload or update your documents from your{' '}
                                    <a
                                        href="/guest/profile"
                                        className="underline hover:text-blue-900"
                                    >
                                        Profile page
                                    </a>
                                    .
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GuestDashboardLayout>
    );
}
