import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthModalContextType {
    isOpen: boolean;
    activeTab: 'login' | 'register';
    openModal: (tab?: 'login' | 'register') => void;
    closeModal: () => void;
    openLogin: () => void;
    openRegister: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

interface AuthModalProviderProps {
    children: ReactNode;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

    const openModal = (tab: 'login' | 'register' = 'login') => {
        setActiveTab(tab);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const openLogin = () => {
        openModal('login');
    };

    const openRegister = () => {
        openModal('register');
    };

    const value = {
        isOpen,
        activeTab,
        openModal,
        closeModal,
        openLogin,
        openRegister
    };

    return (
        <AuthModalContext.Provider value={value}>
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (context === undefined) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
}

export default AuthModalContext;
