// frontend/src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout:  120000, // 30 secondes
});

// Ajouter des intercepteurs pour voir les erreurs
api.interceptors.request.use(
    config => {
        console.log('📤 Requête envoyée à:', config.url);
        console.log('📤 Méthode:', config.method);
        console.log('📤 Données:', config.data);
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
        return response;
    },
    error => {
        console.error('❌ Erreur réponse:', error);
        if (error.response) {
            console.error('📥 Statut:', error.response.status);
            console.error('📥 Données:', error.response.data);
        } else if (error.request) {
            console.error('📥 Pas de réponse du serveur');
        } else {
            console.error('📥 Erreur:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;