// frontend/src/api/axiosConfig.js - Version avec token
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

// ✅ Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
    config => {
        // Récupérer le token depuis localStorage
        const token = localStorage.getItem('token');
        console.log('🔑 Token trouvé:', token ? 'Oui' : 'Non');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Token ajouté à la requête');
        } else {
            console.warn('⚠️ Aucun token trouvé dans localStorage');
        }

        console.log('📤 Requête envoyée à:', config.url);
        console.log('📤 Méthode:', config.method);
        console.log('📤 Headers:', config.headers);
        return config;
    },
    error => {
        console.error('❌ Erreur requête:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => {
        console.log('📥 Réponse reçue de:', response.config.url);
        console.log('📥 Statut:', response.status);
        console.log('📥 Données:', response.data);
        return response;
    },
    error => {
        console.error('❌ Erreur réponse:', error);

        if (error.response) {
            console.error('📥 Statut:', error.response.status);
            console.error('📥 Données:', error.response.data);

            // ✅ Si 401 (non autorisé), rediriger vers login
            if (error.response.status === 401) {
                console.warn('⚠️ Session expirée, redirection vers login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        } else if (error.request) {
            console.error('📥 Pas de réponse du serveur - Vérifiez que le backend est en cours d\'exécution');
        } else {
            console.error('📥 Erreur:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;