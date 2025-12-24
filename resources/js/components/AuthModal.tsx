import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Building, Eye, EyeOff, Mail, Lock, Phone, MapPin, FileText } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'login' | 'register';
}

interface FormErrors {
    [key: string]: string;
}

interface RegistrationData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    address?: string;
    type: 'user' | 'partner';
    terms_accepted: boolean;
    [key: string]: any;
}

interface LoginData {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: any;
}

interface PartnerTermsCondition {
    id: number;
    title: string;
    content: string;
}

interface TermsCondition {
    id: number;
    title: string;
    content: string;
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
    const [registrationType, setRegistrationType] = useState<'user' | 'partner'>('user');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Get terms data from Inertia page props
    const { props } = usePage();
    const partnerTerms = (props.partnerTermsConditions as PartnerTermsCondition[]) || [];
    const userTerms = (props.termsConditions as TermsCondition[]) || [];

    // Login form data
    const [loginData, setLoginData] = useState<LoginData>({
        email: '',
        password: '',
        remember: false
    });

    // Registration form data
    const [registrationData, setRegistrationData] = useState<RegistrationData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        address: '',
        type: 'user',
        terms_accepted: false
    });

    // Reset form when modal opens/closes or tab changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setErrors({});
            setLoginData({
                email: '',
                password: '',
                remember: false
            });
            setRegistrationData({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
                phone: '',
                address: '',
                type: 'user',
                terms_accepted: false
            });
            setRegistrationType('user');
            setShowPassword(false);
            setShowConfirmPassword(false);
            setShowTerms(false);
        }
    }, [isOpen, initialTab]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Get current URL to redirect back after login
        const currentUrl = window.location.href;

        try {
            router.post('/login', {
                ...loginData,
                intended_url: currentUrl
            }, {
                onSuccess: (page) => {
                    onClose();
                    // Reload only auth data to update UI, staying on same page
                    setTimeout(() => {
                        router.reload({ only: ['auth'] });
                    }, 300);
                },
                onError: (errors) => {
                    setErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            setIsSubmitting(false);
        }
    };

    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Validate terms acceptance
        if (!registrationData.terms_accepted) {
            setErrors({ terms_accepted: 'You must accept the terms and conditions' });
            setIsSubmitting(false);
            return;
        }

        // Get current URL to redirect back after registration
        const currentUrl = window.location.href;

        // Update registration data with type and intended URL
        const submitData = {
            ...registrationData,
            type: registrationType,
            intended_url: currentUrl
        };

        try {
            router.post('/register', submitData, {
                onSuccess: (page) => {
                    onClose();
                    // Reload only auth data to update UI, staying on same page
                    setTimeout(() => {
                        router.reload({ only: ['auth'] });
                    }, 300);
                },
                onError: (errors) => {
                    setErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'login'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'register'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'login' ? (
                        // Login Form
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={loginData.email}
                                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={loginData.password}
                                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={loginData.remember}
                                        onChange={(e) => setLoginData(prev => ({ ...prev, remember: e.target.checked }))}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                                </label>
                                <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Signing In...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    ) : (
                        // Registration Form
                        <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                            {/* Registration Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Registration Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRegistrationType('user');
                                            setRegistrationData(prev => ({ ...prev, type: 'user' }));
                                        }}
                                        className={`p-4 border-2 rounded-lg transition-all ${
                                            registrationType === 'user'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <User className={`w-8 h-8 mx-auto mb-2 ${
                                            registrationType === 'user' ? 'text-indigo-600' : 'text-gray-400'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                            registrationType === 'user' ? 'text-indigo-900' : 'text-gray-700'
                                        }`}>
                                            Guest
                                        </span>
                                        <p className={`text-xs mt-1 ${
                                            registrationType === 'user' ? 'text-indigo-600' : 'text-gray-500'
                                        }`}>
                                            Book properties
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRegistrationType('partner');
                                            setRegistrationData(prev => ({ ...prev, type: 'partner' }));
                                        }}
                                        className={`p-4 border-2 rounded-lg transition-all ${
                                            registrationType === 'partner'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <Building className={`w-8 h-8 mx-auto mb-2 ${
                                            registrationType === 'partner' ? 'text-purple-600' : 'text-gray-400'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                            registrationType === 'partner' ? 'text-purple-900' : 'text-gray-700'
                                        }`}>
                                            Partner
                                        </span>
                                        <p className={`text-xs mt-1 ${
                                            registrationType === 'partner' ? 'text-purple-600' : 'text-gray-500'
                                        }`}>
                                            List properties
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={registrationData.name}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter your full name"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={registrationData.email}
                                        onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={registrationData.phone}
                                        onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            {/* Additional field for partners */}
                            {registrationType === 'partner' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Address
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={registrationData.address}
                                            onChange={(e) => setRegistrationData(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Enter your business address"
                                        />
                                    </div>
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={registrationData.password}
                                        onChange={(e) => setRegistrationData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Create a password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={registrationData.password_confirmation}
                                        onChange={(e) => setRegistrationData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                            </div>

                            {/* Terms and Conditions */}
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={registrationData.terms_accepted}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                // If checking the box, open terms modal first
                                                setShowTerms(true);
                                            } else {
                                                // If unchecking, just uncheck
                                                setRegistrationData(prev => ({ ...prev, terms_accepted: false }));
                                            }
                                        }}
                                        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-600">
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowTerms(true)}
                                            className="text-indigo-600 hover:text-indigo-700 underline"
                                        >
                                            Terms and Conditions
                                        </button>
                                        {registrationType === 'partner' && ' for Partners'}
                                    </label>
                                </div>
                                {errors.terms_accepted && <p className="text-red-500 text-xs">{errors.terms_accepted}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !registrationData.terms_accepted}
                                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating Account...
                                    </div>
                                ) : (
                                    `Create ${registrationType === 'partner' ? 'Partner' : 'User'} Account`
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Terms Modal */}
            {showTerms && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => {
                            setShowTerms(false);
                            // Automatically check the terms when user closes the modal by clicking backdrop
                            setRegistrationData(prev => ({ ...prev, terms_accepted: true }));
                        }}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Terms and Conditions {registrationType === 'partner' && 'for Partners'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowTerms(false);
                                        // Automatically check the terms when user closes the modal
                                        setRegistrationData(prev => ({ ...prev, terms_accepted: true }));
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="prose max-w-none">
                                {registrationType === 'partner' ? (
                                    /* Partner Terms from Database */
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900">Partner Terms & Conditions</h4>
                                        {partnerTerms && partnerTerms.length > 0 ? (
                                            partnerTerms.map((term) => (
                                                <div key={term.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                                    <h5 className="text-md font-bold text-gray-800 mb-2">{term.title}</h5>
                                                    <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                                        {term.content}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="space-y-4 text-sm text-gray-600">
                                                <p>By registering as a partner, you agree to the following terms:</p>
                                                <ul className="list-disc pl-6 space-y-2">
                                                    <li>You must provide accurate and complete information about your properties</li>
                                                    <li>You are responsible for maintaining property standards and safety</li>
                                                    <li>Commission rates and payment terms as agreed in the partnership agreement</li>
                                                    <li>You must respond to booking inquiries within 24 hours</li>
                                                    <li>You agree to follow our cancellation and refund policies</li>
                                                    <li>You are responsible for legal compliance in your jurisdiction</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* User/Guest Terms from Database */
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900">User Terms & Conditions</h4>
                                        {userTerms && userTerms.length > 0 ? (
                                            userTerms.map((term) => (
                                                <div key={term.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                                    <h5 className="text-md font-bold text-gray-800 mb-2">{term.title}</h5>
                                                    <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                                        {term.content}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="space-y-4 text-sm text-gray-600">
                                                <p>By creating a user account, you agree to:</p>
                                                <ul className="list-disc pl-6 space-y-2">
                                                    <li>Provide accurate personal information</li>
                                                    <li>Use our platform responsibly and legally</li>
                                                    <li>Respect property rules and guidelines</li>
                                                    <li>Pay for bookings as agreed</li>
                                                    <li>Follow our community guidelines</li>
                                                    <li>Report any issues or damages promptly</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowTerms(false);
                                        // Automatically check the terms when user closes the modal
                                        setRegistrationData(prev => ({ ...prev, terms_accepted: true }));
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    Accept & Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
