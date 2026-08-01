import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    constructor() {
        this.client = null;
        this.isConnected = false;  // ✅ C'est une propriété, pas une fonction
        this.listeners = [];
        this.statusListeners = [];
    }

    connect(userId) {
        if (this.isConnected) {
            console.log('⚠️ WebSocket déjà connecté');
            return;
        }

        if (!userId) {
            console.warn('⚠️ Aucun userId pour WebSocket');
            return;
        }

        try {
            const socket = new SockJS('http://localhost:8080/ws');
            this.client = new Client({
                webSocketFactory: () => socket,
                debug: (str) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('🔗 WebSocket:', str);
                    }
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: () => {
                    console.log('✅ WebSocket connecté pour l\'utilisateur:', userId);
                    this.isConnected = true;
                    this.subscribeToUserNotifications(userId);
                    this.subscribeToStatusChanges();
                    this.notifyListeners({ type: 'CONNECTED' });
                },
                onDisconnect: () => {
                    console.log('❌ WebSocket déconnecté');
                    this.isConnected = false;
                    this.notifyListeners({ type: 'DISCONNECTED' });
                },
                onStompError: (frame) => {
                    console.error('❌ Erreur STOMP:', frame);
                    this.notifyListeners({ type: 'ERROR', data: frame });
                }
            });

            this.client.activate();
        } catch (error) {
            console.error('❌ Erreur connexion WebSocket:', error);
        }
    }

    subscribeToUserNotifications(userId) {
        if (!this.client || !this.isConnected) return;

        try {
            this.client.subscribe(`/topic/user/${userId}/notifications`, (message) => {
                try {
                    const notification = JSON.parse(message.body);
                    console.log('🔔 Nouvelle notification reçue:', notification);
                    this.notifyListeners(notification);
                } catch (e) {
                    console.error('❌ Erreur parsing notification:', e);
                }
            });
            console.log('✅ Abonné aux notifications utilisateur:', userId);
        } catch (error) {
            console.error('❌ Erreur abonnement notifications:', error);
        }
    }

    subscribeToStatusChanges() {
        if (!this.client || !this.isConnected) return;

        try {
            this.client.subscribe('/topic/status-changes', (message) => {
                try {
                    const data = message.body;
                    console.log('🔄 Changement de statut reçu:', data);
                    this.notifyStatusListeners(data);
                } catch (e) {
                    console.error('❌ Erreur parsing status:', e);
                }
            });
            console.log('✅ Abonné aux changements de statut');
        } catch (error) {
            console.error('❌ Erreur abonnement status:', error);
        }
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    addStatusListener(callback) {
        if (typeof callback === 'function') {
            this.statusListeners.push(callback);
        }
    }

    removeStatusListener(callback) {
        this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error('❌ Erreur listener:', e);
            }
        });
    }

    notifyStatusListeners(data) {
        this.statusListeners.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error('❌ Erreur status listener:', e);
            }
        });
    }

    disconnect() {
        if (this.client && this.isConnected) {
            try {
                this.client.deactivate();
                this.isConnected = false;
                console.log('🔌 WebSocket déconnecté');
                this.notifyListeners({ type: 'DISCONNECTED' });
            } catch (error) {
                console.error('❌ Erreur déconnexion WebSocket:', error);
            }
        }
    }

    isConnected() {
        return this.isConnected;
    }
}

export default new WebSocketService();