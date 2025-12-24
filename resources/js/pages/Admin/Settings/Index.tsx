import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Image,
    FileText,
    Mail,
    Shield,
    Share2,
    Globe,
    Edit,
    Plus,
    Trash2,
    Eye,
} from 'lucide-react';
import HeaderModal from './Components/HeaderModal';
import HeroModal from './Components/HeroModal';
import FooterModal from './Components/FooterModal';
import PrivacyPolicyModal from './Components/PrivacyPolicyModal';
import TermsConditionsModal from './Components/TermsConditionsModal';
import PartnerTermsModal from './Components/PartnerTermsModal';
import SocialLinkModal from './Components/SocialLinkModal';

interface Header {
    id: number;
    logo: string | null;
}

interface HeroSection {
    id: number;
    background_image: string | null;
    title_small: string | null;
    title_big: string | null;
}

interface Footer {
    id: number;
    footer_logo: string | null;
    address: string | null;
    email: string | null;
    contact_number: string | null;
    website: string | null;
    terms_title: string | null;
    terms_link: string | null;
    privacy_title: string | null;
    privacy_link: string | null;
    rights_reserves_text: string | null;
}

interface SocialLink {
    id: number;
    icon_class: string;
    link: string;
}

interface PrivacyPolicy {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface TermsCondition {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface PartnerTermsCondition {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface Props {
    header: Header | null;
    heroSection: HeroSection | null;
    footer: Footer | null;
    socialLinks: SocialLink[];
    privacyPolicies: PrivacyPolicy[];
    termsConditions: TermsCondition[];
    partnerTermsConditions: PartnerTermsCondition[];
}

export default function Index({
    header,
    heroSection,
    footer,
    socialLinks,
    privacyPolicies,
    termsConditions,
    partnerTermsConditions,
}: Props) {
    const [headerModalOpen, setHeaderModalOpen] = useState(false);
    const [heroModalOpen, setHeroModalOpen] = useState(false);
    const [footerModalOpen, setFooterModalOpen] = useState(false);
    const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [partnerTermsModalOpen, setPartnerTermsModalOpen] = useState(false);
    const [socialLinkModalOpen, setSocialLinkModalOpen] = useState(false);

    const settingSections = [
        {
            title: 'Header Settings',
            description: 'Update website logo and header information',
            icon: Image,
            color: 'from-blue-500 to-indigo-600',
            action: () => setHeaderModalOpen(true),
            data: header,
        },
        {
            title: 'Hero Section',
            description: 'Configure homepage hero section content',
            icon: Globe,
            color: 'from-purple-500 to-pink-600',
            action: () => setHeroModalOpen(true),
            data: heroSection,
        },
        {
            title: 'Footer Settings',
            description: 'Manage footer content and contact information',
            icon: Mail,
            color: 'from-green-500 to-teal-600',
            action: () => setFooterModalOpen(true),
            data: footer,
        },
        {
            title: 'Social Media Links',
            description: `Manage social media links (${socialLinks.length} active)`,
            icon: Share2,
            color: 'from-orange-500 to-red-600',
            action: () => setSocialLinkModalOpen(true),
            data: socialLinks,
        },
        {
            title: 'Privacy Policies',
            description: `Manage privacy policy content (${privacyPolicies.length} policies)`,
            icon: Shield,
            color: 'from-cyan-500 to-blue-600',
            action: () => setPrivacyModalOpen(true),
            data: privacyPolicies,
        },
        {
            title: 'Terms & Conditions',
            description: `Manage terms & conditions (${termsConditions.length} terms)`,
            icon: FileText,
            color: 'from-violet-500 to-purple-600',
            action: () => setTermsModalOpen(true),
            data: termsConditions,
        },
        {
            title: 'Partner Terms & Conditions',
            description: `Manage partner terms (${partnerTermsConditions.length} terms)`,
            icon: FileText,
            color: 'from-pink-500 to-rose-600',
            action: () => setPartnerTermsModalOpen(true),
            data: partnerTermsConditions,
        },
    ];

    return (
        <AdminLayout>
            <Head title="Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Website Settings
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage all your website content and configuration
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settingSections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group"
                            >
                                <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {section.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {section.description}
                                    </p>
                                    <button
                                        onClick={section.action}
                                        className={`w-full px-4 py-2 rounded-lg bg-gradient-to-r ${section.color} text-white font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                                    >
                                        <Edit className="w-4 h-4 inline-block mr-2" />
                                        Manage
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-6 border border-indigo-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="text-2xl font-bold text-indigo-600">{socialLinks.length}</div>
                            <div className="text-sm text-gray-600">Social Links</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{privacyPolicies.length}</div>
                            <div className="text-sm text-gray-600">Privacy Policies</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="text-2xl font-bold text-pink-600">{termsConditions.length}</div>
                            <div className="text-sm text-gray-600">Terms & Conditions</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="text-2xl font-bold text-blue-600">{partnerTermsConditions.length}</div>
                            <div className="text-sm text-gray-600">Partner Terms</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <HeaderModal
                isOpen={headerModalOpen}
                onClose={() => setHeaderModalOpen(false)}
                header={header}
            />
            <HeroModal
                isOpen={heroModalOpen}
                onClose={() => setHeroModalOpen(false)}
                heroSection={heroSection}
            />
            <FooterModal
                isOpen={footerModalOpen}
                onClose={() => setFooterModalOpen(false)}
                footer={footer}
            />
            <PrivacyPolicyModal
                isOpen={privacyModalOpen}
                onClose={() => setPrivacyModalOpen(false)}
                privacyPolicies={privacyPolicies}
            />
            <TermsConditionsModal
                isOpen={termsModalOpen}
                onClose={() => setTermsModalOpen(false)}
                termsConditions={termsConditions}
            />
            <PartnerTermsModal
                isOpen={partnerTermsModalOpen}
                onClose={() => setPartnerTermsModalOpen(false)}
                partnerTermsConditions={partnerTermsConditions}
            />
            <SocialLinkModal
                isOpen={socialLinkModalOpen}
                onClose={() => setSocialLinkModalOpen(false)}
                socialLinks={socialLinks}
            />
        </AdminLayout>
    );
}
