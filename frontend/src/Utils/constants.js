// utils/constants.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const STATUS_COLORS = {
    EN_ATTENTE: '#FFC107',
    ACCEPTE: '#4CAF50',
    REFUSE: '#F44336',
    RELANCE: '#FF9800',
    CONFIRME: '#2196F3',
    REALISE: '#9E9E9E',
    ANNULE: '#000000',
};

export const STATUS_LABELS = {
    EN_ATTENTE: 'En attente',
    ACCEPTE: 'Accepté',
    REFUSE: 'Refusé',
    RELANCE: 'Relancé',
    CONFIRME: 'Confirmé',
    REALISE: 'Réalisé',
    ANNULE: 'Annulé',
};

export const ROLES = {
    ADMIN: 'Administrateur',
    RESPONSABLE: 'Responsable',
    TECHNICIEN: 'Technicien',
};

export const API_ENDPOINTS = {
    LOGIN: '/auth/login',
    CLIENTS: '/clients',
    SITES: '/sites',
    CONTRATS: '/contrats',
    PLANNINGS: '/plannings',
    PIECES: '/pieces',
    USERS: '/utilisateurs',
};