// frontend/src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = () => {
        const token = localStorage.getItem('token');
        return !!token && !!user;
    };

    // Vérifier si l'utilisateur a le bon rôle
    const hasRequiredRole = () => {
        if (!user || !user.role) return false;
        if (allowedRoles.length === 0) return true;
        return allowedRoles.includes(user.role);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Chargement...</p>
            </div>
        );
    }

    // Si non authentifié → rediriger vers login
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Si authentifié mais rôle non autorisé → rediriger vers accueil
    if (!hasRequiredRole()) {
        return <Navigate to="/" replace />;
    }

    // ✅ Tout est bon, afficher la page
    return children;
};

export default ProtectedRoute;