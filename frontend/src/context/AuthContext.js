import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        console.log('📥 storedUser from localStorage:', storedUser);
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('📥 parsedUser:', parsedUser);
                console.log('📥 role:', parsedUser.role);
                setUser(parsedUser);
            } catch (e) {
                console.error('Erreur parsing user:', e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        console.log('🔐 Login - Données reçues:', userData);
        console.log('🔐 Login - Rôle:', userData.role);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
    };

    const isAdmin = user?.role === 'ADMIN';
    const isResponsable = user?.role === 'RESPONSABLE_SOFTWARE';
    const isTechnicien = user?.role === 'TECHNICIEN_HARDWARE';

    console.log('👤 user:', user);
    console.log('🔑 role:', user?.role);
    console.log('👑 isAdmin:', isAdmin);
    console.log('📋 isResponsable:', isResponsable);
    console.log('🔧 isTechnicien:', isTechnicien);

    const value = {
        user,
        login,
        logout,
        loading,
        isAdmin,
        isResponsable,
        isTechnicien,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};